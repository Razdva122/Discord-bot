import { User, Guild, Message } from 'discord.js';

import { TAnswer, TGameResult, IGameFinishState, TGameType, TGameMaps } from '../types';

import {
  ServerModel, GameStartedModel, GameCanceledModel, 
  UserModel, GameFinishedModel, IGameCanceled,
  IGameFinished, IGameStarted, GameDeletedModel, IGameDeleted,
  TServerStats, IGameChangeRating,
} from '../models';

import { 
  defaultRating, ratingChange, gameSize,
  usersInLeaderboard, maxNicknameForLeadeboardLength,
} from '../consts';

import { IShortUser } from '../models/shortUser';
import { Res, Err } from '../utils/response';

function calculateWinrate(wins: number, loses: number): string {
  return `${Math.floor(wins / (wins + loses) * 100)} %`;
}

export class Server {
  readonly serverID: string
  private systemMessages: {
    leaderboard: null | Message,
    stats: null | Message,
  } = { leaderboard: null, stats: null };
  lastGameID: number
  name: string
  users: { 
    admins: {
      roleID: string,
    },
    verified: {
      roleID: string,
    }
  }
  stats: TServerStats
  
  constructor({ adminsRoleID, verifiedRoleID, serverName, serverID, lastGameID, stats }: 
    { adminsRoleID: string, verifiedRoleID: string, serverName: string, serverID: string, lastGameID: number, stats: TServerStats }) {
    this.users = {
      admins: {
        roleID: adminsRoleID,
      },
      verified: {
        roleID: verifiedRoleID,
      }
    }

    this.name = serverName;

    this.serverID = serverID;
    this.lastGameID = lastGameID;

    this.stats = stats;
  }

  public async updateRole(roleToChange: 'admins' | 'verified', newRoleID: string) {
    if (roleToChange === 'admins') {
      await ServerModel.findOneAndUpdate({ id: this.serverID }, { adminsID: newRoleID });
    }

    if (roleToChange === 'verified') {
      await ServerModel.findOneAndUpdate({ id: this.serverID }, { verifiedID: newRoleID });
    }
    this.users[roleToChange].roleID === newRoleID;
  }

  public async startGame(map: TGameMaps, usersInGame: IShortUser[], msg: Message): Promise<TAnswer> {
    this.lastGameID += 1;
    await ServerModel.findOneAndUpdate({ id: this.serverID }, { lastGameID: this.lastGameID });
    const createGame = new GameStartedModel({
      id: this.lastGameID,
      state: 'started',
      type: usersInGame.length === gameSize.mini ? 'mini' : 'full',
      map,
      players: usersInGame,
      started_by: {
        name: this.getNicknameOfAuthor(msg),
        id: msg.author.id,
      },
    });
    const res = await createGame.save();

    await Promise.all(usersInGame.map(async (user) => {
      const userInDB = await UserModel.findOneAndUpdate({ id: user.id }, { name: user.name });
      if (!userInDB) {
        const newUser = new UserModel({ id: user.id, name: user.name, gamesID: [], history: [], rating: defaultRating });
        await newUser.save();
      }
    }));

    return Res(`Создана игра с ID: ${this.lastGameID}. Участники: ${usersInGame.map((user) => user.name).join(', ')}`);
  }

  public async endGame(gameID: number, gameStatus: TGameResult, msg: Message): Promise<TAnswer> {
    const prevGameState = await GameStartedModel.findOne({ id: gameID });
    if (!prevGameState) {
      return Err(`Не найдена игра с ID: ${gameID}`);
    }

    const mentions = msg.mentions.members;

    if (!mentions) {
      return Err(`В команде не указаны импостеры`);
    }

    const impostors = mentions.array().map((member) => {
      return { 
        id: member.id,
        name: member.user.username,
      }
    });

    if (prevGameState.players.length === gameSize.mini) {
      if (impostors.length !== 1) {
        return Err(`В игре на ${gameSize.mini} человек, должен быть один импостер`);
      }
    }

    if (prevGameState.players.length === gameSize.full) {
      if (impostors.length !== 2) {
        return Err(`В игре на ${gameSize.full} человек, должно быть два импостера`);
      }
    }

    if (!prevGameState.players.some((player) => player.id === impostors[0].id)) {
      return Err(`Игрок ${impostors[0].name} не был в игре id: ${gameID} на момент ее создания`);
    }

    if (impostors[1] && !prevGameState.players.some((player) => player.id === impostors[1].id)) {
      return Err(`Игрок ${impostors[1].name} не был в игре id: ${gameID} на момент ее создания`);
    }

    const deletePrevGame = await GameStartedModel.findOneAndDelete({ id: gameID });

    if (!deletePrevGame) {
      return Err(`Не найдена игра с ID: ${gameID}`);
    }

    const crewmates = deletePrevGame.players.filter((player) => {
      return player.id !== impostors[0].id && player.id !== impostors[1]?.id;
    })

    const finishGame = await this.updateRatingAndFinishGame({
      id: gameID,
      type: prevGameState.type,
      map: prevGameState.map,
      impostorsRes: gameStatus,
      impostors,
      crewmates,
      started_by: deletePrevGame.started_by,
      finished_by: {
        name: this.getNicknameOfAuthor(msg),
        id: msg.author.id,
      },
    });

    if (finishGame.error) {
      return finishGame;
    }

    const finishedGame = new GameFinishedModel(finishGame.result.data);

    await finishedGame.save();

    const firstLine = `Игра ID: ${gameID} успешно завершена`;
    const secondLine = `Победили ${finishGame.result.data.win}`;
    const crewmatesInString = finishGame.result.data.result.crewmates.map((user) => {
      return `${user.name} ${user.before} (${user.diff < 0 ? '' : '+'}${user.diff})`;
    }).join(' | ');
    const crewmatesLine = `Crewmates: ${crewmatesInString}`;
    const impostorsInString = finishGame.result.data.result.impostors.map((user) => {
      return `${user.name} ${user.before} (${user.diff < 0 ? '' : '+'}${user.diff})`;
    }).join(' | ');
    const impostorsLine = `Impostors: ${impostorsInString}`;

    await this.updateStats(finishGame.result.data.type, finishGame.result.data.map, finishGame.result.data.win === 'crewmates' ? 'crewmates_win' : 'imposters_win', 1);
    this.updateSystemMessages();

    return Res(`${firstLine}\n${secondLine}\n${crewmatesLine}\n${impostorsLine}`);
  }

  private async updateRatingAndFinishGame(state: IGameFinishState): Promise<TAnswer<IGameFinished>> {
    const crewmatesRes: { [key in TGameResult]: TGameResult} = {
      win: 'lose',
      lose: 'win',
    };

    const players = [...state.impostors, ...state.crewmates];
    const gameResult: IGameFinished = {
      id: state.id,
      state: "finished",
      win: state.impostorsRes === 'lose' ? 'crewmates' : 'impostors',
      map: state.map,
      type: state.type,
      impostors: state.impostors,
      crewmates: state.crewmates,
      result: {
        crewmates: [],
        impostors: [],
      },
      started_by: state.started_by,
      finished_by: state.finished_by,
    };

    await Promise.all(players.map(async (player) => {
      const playerIs = state.impostors.some((impostor) => impostor.id === player.id) ? 'impostor' : 'crewmate';
      let diff = ratingChange[playerIs][state.type];
      if (playerIs === 'impostor' && state.impostorsRes === 'lose') {
        diff *= -1;
      }

      if (playerIs === 'crewmate' && state.impostorsRes === 'win') {
        diff *= -1;
      }
      const playerFromDB = await UserModel.findOne({ id: player.id });

      if (!playerFromDB) {
        console.log(`Error updateRatingAndFinishGame ID:${player.id} dont updated`);
        return;
      }

      playerFromDB.rating += diff;
      playerFromDB.gamesID.push(state.id);
      playerFromDB.history.push({
        reason: playerIs === 'impostor' ? state.impostorsRes : crewmatesRes[state.impostorsRes],
        map: state.map,
        team: playerIs === 'impostor' ? 'impostors' : 'crewmates',
        gameID: state.id,
        rating: {
          before: playerFromDB.rating - diff,
          after: playerFromDB.rating,
          diff,
        },
      });

      await playerFromDB.save();

      gameResult.result[playerIs === 'impostor' ? 'impostors' : 'crewmates']
        .push({ name: player.name, before: playerFromDB.rating - diff, diff, id: player.id });
    }));

    return Res(gameResult);
  }

  public async cancelGame(gameID: number, msg: Message): Promise<TAnswer> {
    const prevGameState = await GameStartedModel.findOneAndDelete({ id: gameID });
    if (!prevGameState) {
      return Err(`Не найдена игра с ID: ${gameID}`);
    }

    const canceledGame = new GameCanceledModel({
      id: prevGameState.id,
      state: 'canceled',
      type: prevGameState.type,
      map: prevGameState.map,
      players: prevGameState.players,
      started_by: prevGameState.started_by,
      canceled_by: {
        name: this.getNicknameOfAuthor(msg),
        id: msg.author.id,
      }
    });

    await canceledGame.save();

    return Res(`Игра ID: ${gameID} отменена`);
  }

  public async deleteGame(gameID: number, msg: Message): Promise<TAnswer> {
    const prevGameState = await GameFinishedModel.findOneAndDelete({ id: gameID });
    if (!prevGameState) {
      return Err(`Не найдена игра с ID: ${gameID}`);
    }

    const revertRating = await this.revertRating(prevGameState);

    if (revertRating.error) {
      return revertRating;
    }

    const deletedGame = new GameDeletedModel({
      id: prevGameState.id,
      impostors: prevGameState.impostors,
      crewmates: prevGameState.crewmates,
      win: prevGameState.win,
      type: prevGameState.type,
      map: prevGameState.map,
      result: prevGameState.result,
      state: 'deleted',
      started_by: prevGameState.started_by,
      finished_by: prevGameState.finished_by,
      deleted_by: {
        name: this.getNicknameOfAuthor(msg),
        id: msg.author.id,
      }
    });

    await deletedGame.save();

    return Res(`Игра ID: ${gameID} удалена, рейтинг был возвращен`);
  }

  public async changeRating(diff: number, msg: Message): Promise<TAnswer> {
    const mentions = msg.mentions.members;

    if (!mentions) {
      return Err('В команде не указан юзер, которому нужно изменить рейтинг');
    }

    const users = mentions.array();
    if (users.length !== 1) {
      return Err('В команде нужно указать одного юзера');
    }

    const user = await UserModel.findOne({ id: users[0].id });
    if (!user) {
      return Err('Юзер не найден в базе данных');
    }

    user.rating += diff;
    user.history.push({
      reason: 'manualy',
      changedBy: {
        name: this.getNicknameOfAuthor(msg),
        id: msg.author.id,
      },
      rating: {
        before: user.rating - diff,
        after: user.rating,
        diff,
      },
    });
    await user.save();

    return Res(`Рейтинг юзера ${msg.guild?.member(users[0])?.nickname || users[0].user.username} изменен на ${diff}`);
  }

  private async revertRating(game: IGameFinished): Promise<TAnswer> {
    const players = [...game.crewmates, ...game.impostors];
    await Promise.all(players.map(async (player) => {
      const user = await UserModel.findOne({ id: player.id });
      if (!user) {
        return;
      }

      const gameRes = [...game.result.impostors, ...game.result.crewmates];
      const diff = gameRes.find((user) => user.id === player.id)!.diff;
      user.rating -= diff;
      user.history.push({
        reason: 'revert',
        map: game.map,
        team: game.impostors.find((u) => u.id === player.id) ? 'impostors' : 'crewmates',
        gameID: game.id,
        rating: {
          before: user.rating + diff,
          after: user.rating,
          diff: -diff,
        }
      });
      await user.save();
    }));

    await this.updateStats(game.type, game.map, game.win === 'crewmates' ? 'crewmates_win' : 'imposters_win', -1);
    await this.updateSystemMessages();

    return Res('Рейтинг возвращен');
  }

  public async initLeaderboard(msg: Message): Promise<void> {
    const leaderboard = await this.generateLeaderboard();
    this.systemMessages.leaderboard = await msg.channel.send(leaderboard);
  }

  public async initStats(msg: Message): Promise<void> {
    const stats = await this.generateStats();
    this.systemMessages.stats = await msg.channel.send(stats);
  }

  public async getStats(msg: Message): Promise<TAnswer> {
    const user = await UserModel.findOne({ id: msg.author.id });
    if (!user) {
      return Err('Мы не смогли найти вашу статистику в базе');
    }

    let statsMsg = `-------------**Статистика**-------------\n`;
    statsMsg += `Пользователь: ${msg.author.username}\n`
    statsMsg += `Текущий рейтинг: ${user.rating}\n\n`;
    const games = user.history.filter(el => el.reason !== 'manualy' && el.reason !== 'revert') as IGameChangeRating[];
    const polusGames = games.filter(el => el.map === 'polus');
    const skeldGames = games.filter(el => el.map === 'skeld');
    const maps: TGameMaps[] = ['skeld', 'polus'];
    // TODO rewrite to O(N)
    const stats = {
      skeld: {
        total: {
          win: skeldGames.filter(el => el.reason === 'win').length,
          lose: skeldGames.filter(el => el.reason === 'lose').length,
        },
        imposter: {
          win: skeldGames.filter(el => el.team === 'impostors' && el.reason === 'win').length,
          lose: skeldGames.filter(el => el.team === 'impostors' && el.reason === 'lose').length,
        },
        crewmate: {
          win: skeldGames.filter(el => el.team === 'crewmates' && el.reason === 'win').length,
          lose: skeldGames.filter(el => el.team === 'crewmates' && el.reason === 'lose').length,
        },
      },
      polus: {
        total: {
          win: polusGames.filter(el => el.reason === 'win').length,
          lose: polusGames.filter(el => el.reason === 'lose').length,
        },
        imposter: {
          win: polusGames.filter(el => el.team === 'impostors' && el.reason === 'win').length,
          lose: polusGames.filter(el => el.team === 'impostors' && el.reason === 'lose').length,
        },
        crewmate: {
          win: polusGames.filter(el => el.team === 'crewmates' && el.reason === 'win').length,
          lose: polusGames.filter(el => el.team === 'crewmates' && el.reason === 'lose').length,
        },
      },
    };
    const wins = stats.polus.imposter.win + stats.polus.crewmate.win
      + stats.skeld.imposter.win + stats.skeld.crewmate.win;
    const loses = games.length - wins;
    statsMsg += `Общее количество игр: ${games.length}\n`;
    statsMsg += `Побед: ${wins}\n`;
    statsMsg += `Поражений: ${loses}\n`;
    statsMsg += `Процент побед: ${Math.floor(wins / games.length * 100)} %\n\n`;
    for (let map of maps) {
      const mapStats = stats[map];
      statsMsg += `Карта: ${map}\n`;
      statsMsg += `Игры: ${mapStats.total.win}/${mapStats.total.lose} Процент побед: ${calculateWinrate(mapStats.total.win, mapStats.total.lose)}\n`;
      statsMsg += `Imposters: ${mapStats.imposter.win}/${mapStats.imposter.lose} Процент побед: ${calculateWinrate(mapStats.imposter.win, mapStats.imposter.lose)}\n`;
      statsMsg += `Crewmates: ${mapStats.crewmate.win}/${mapStats.crewmate.lose} Процент побед: ${calculateWinrate(mapStats.crewmate.win, mapStats.crewmate.lose)}\n\n`;
    }
    statsMsg += `Последние 10 изменений рейтинга\n`;
    statsMsg += '```d\n';
    statsMsg += 'Действие           GameID      Рейтинг\n';
    statsMsg += '-------------------------------------\n';
    const lastActions = user.history.slice(user.history.length >= 10 ? user.history.length - 10 : 0);
    lastActions.forEach((el) => {
      const diff = el.rating.diff < 0 ? el.rating.diff : `+${el.rating.diff}`
      if (el.reason === 'manualy') {
        statsMsg += `Изменен в ручную               ${el.rating.before} ${diff}\n`;
        return;
      }
      const startOfMsg = {
        'revert': 'Возврат за игру   ',
        'win': 'Победа в игре     ',
        'lose': 'Поражение в игре  ',
      }
      statsMsg += `${startOfMsg[el.reason]} ${el.gameID}          ${el.rating.before} ${diff}\n`;
      return;
    });
    statsMsg += '```';

    msg.author.send(statsMsg);
    return Res('Статистика отправлена в личные сообщения');
  }

  private async updateLeaderboardMsg(): Promise<void> {
    if (!this.systemMessages.leaderboard) {
      return;
    }
    const leaderboard = await this.generateLeaderboard();

    await this.systemMessages.leaderboard.edit(leaderboard);
  }

  private async updateStatsMsg(): Promise<void> {
    if (!this.systemMessages.stats) {
      return;
    }
    const stats = await this.generateStats();

    await this.systemMessages.stats.edit(stats);
  }

  private async updateStats(type: TGameType, map: TGameMaps, res: 'imposters_win' | 'crewmates_win', diff: 1 | -1): Promise<void> {
    this.stats[map][type].amount += diff;
    this.stats[map][type][res] += diff;
    await ServerModel.findOneAndUpdate({ id: this.serverID }, { stats: this.stats });
  }

  private async updateSystemMessages(): Promise<void> {
    await this.updateLeaderboardMsg();
    await this.updateStatsMsg();
  }

  private async generateLeaderboard(): Promise<string> {
    const bestUsers = await UserModel.find().sort({ rating: -1 }).limit(usersInLeaderboard);

    const message = bestUsers.map((user, index) => {
      let username = user.name.split('').filter((char) => char !== `'`).join('');
      if (username.length <= maxNicknameForLeadeboardLength) {
        while(username.length < maxNicknameForLeadeboardLength) {
          username += ' ';
        }
      } else {
        username = username.slice(0, maxNicknameForLeadeboardLength - 3) + '...';
      }
      return `${index + 1}. ${index < 9 ? ' ' : ''}${username} ${user.rating}`;
    }).join('\n');

    return '```d\n' + `Лидерборд ТОП-${bestUsers.length}\n` + message + '```';
  }

  private generateStats(): string {
    let message = `Статистика:\n`;
    const maps: TGameMaps[] = ['skeld', 'polus'];
    for (let map of maps) {
      const mapStats = this.stats[map];
      message += `---------------------------------\n`;
      message += `Карта: ${map}\n`;
      message += `Полные игры (${gameSize.full} человек):\n`;
      message += `Количество игр: ${mapStats.full.amount}\n`;
      message += `Imposters: Побед - ${mapStats.full.imposters_win}, Winrate - ${Math.round(mapStats.full.imposters_win / mapStats.full.amount * 100)} %\n`;
      message += `Crewmates: Побед - ${mapStats.full.crewmates_win}, Winrate - ${Math.round(mapStats.full.crewmates_win / mapStats.full.amount * 100)} %\n`;
      message += '\n';
      message += `Мини игры (${gameSize.mini} человек):\n`
      message += `Количество игр: ${mapStats.mini.amount}\n`;
      message += `Imposters: Побед - ${mapStats.mini.imposters_win}, Winrate - ${Math.round(mapStats.mini.imposters_win / mapStats.mini.amount * 100)} %\n`;
      message += `Crewmates: Побед - ${mapStats.mini.crewmates_win}, Winrate - ${Math.round(mapStats.mini.crewmates_win / mapStats.mini.amount * 100)} %\n\n`;
    }
    return '```d\n' + message + '```';
  }

  public async gameHistory(gameID: number): Promise<TAnswer> {
    const finishedGame = await GameFinishedModel.findOne({ id: gameID });
    if (finishedGame) {
      return this.gameHistoryMessage(finishedGame);
    }

    const canceledGame = await GameCanceledModel.findOne({ id: gameID });
    if (canceledGame) {
      return this.gameHistoryMessage(canceledGame);
    }

    const startedGame = await GameStartedModel.findOne({ id: gameID });
    if (startedGame) {
      return this.gameHistoryMessage(startedGame);
    }

    const deletedGame = await GameDeletedModel.findOne({ id: gameID });
    if (deletedGame) {
      return this.gameHistoryMessage(deletedGame);
    }

    return Err(`Игра с ID: ${gameID} не была найдена`);
  }

  private gameHistoryMessage(game: IGameCanceled | IGameStarted | IGameFinished | IGameDeleted): TAnswer {
    let message: string = `\nGame ID: ${game.id}\n`;
    const statusMap = {
      canceled: 'Отменена',
      started: 'В процессе',
      finished: 'Завершена',
      deleted: 'Удалена',
    };
    message += `Статус: ${statusMap[game.state]}\n`;
    message += `Тип: ${game.type === 'mini' ? 'мини' : 'полная'}\n`;
    message += `Карта: ${game.map}\n`;
    if (game.state === 'canceled' || game.state === 'started') {
      message += `Участники: *${game.players.map((p) => p.name).join(', ')}*\n`;
    } else {
      message += `Crewmates: *${game.crewmates.map((p) => p.name).join(', ')}*\n`;
      message += `Impostors: *${game.impostors.map((p) => p.name).join(', ')}*\n`;
    }
    message += `Начал игру: ${game.started_by.name}\n`;
    if (game.state === 'finished' || game.state === 'deleted') {
      message += `Закончил игру: ${game.finished_by.name}\n`;
      message += `Результат: Победа ${game.win === 'crewmates' ? 'Crewmates' : 'Impostors'}\n`;
    }
    if (game.state === 'deleted') {
      message += `Удалил игру: ${game.deleted_by.name}\n`;
    }
    if (game.state === 'canceled') {
      message += `Отменил игру: ${game.canceled_by.name}\n`;
    }
    return Res(message);
  }

  private getNicknameOfAuthor(msg: Message): string {
    return msg.guild?.member(msg.author)?.nickname || msg.author.username;
  }

  public isUserVerified(user: User, guild: Guild): boolean {
    const role = guild.roles.cache.find((role) => role.id === this.users.verified.roleID);
    return Boolean(role && role.members.has(user.id));
  }

  public isUserAdmin(user: User, guild: Guild) {
    const role = guild.roles.cache.find((role) => role.id === this.users.admins.roleID);
    return Boolean(role && role.members.has(user.id));
  }
}