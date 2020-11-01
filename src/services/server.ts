import { User, Guild, Message, Client } from 'discord.js';

import { TAnswer, TGameResult, IGameFinishState, TGameType, TGameMaps } from '../types';

import {
  ServerModel, GameStartedModel, GameCanceledModel, 
  UserModel, GameFinishedModel, IGameCanceled,
  IGameFinished, IGameStarted, GameDeletedModel, IGameDeleted,
  TServerStats, IGameChangeRating,
} from '../models';

import { 
  defaultRating, ratingChange,
  usersInLeaderboard, maxNicknameForLeadeboardLength,
} from '../consts';

import { IShortUser } from '../models/shortUser';
import { Res, Err } from '../utils/response';
import { generateTable, TTableOptions } from '../utils/table';

function calculateWinrate(wins: number, loses: number): string {
  return `${Math.floor(wins / (wins + loses) * 100) || 0} %`;
}

export class Server {
  readonly serverID: string
  private systemMessages: {
    leaderboard: null | Message,
    stats: null | Message,
  } = { leaderboard: null, stats: null };
  client: Client
  lastGameID: number
  playersAmount: number
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
  
  constructor({ adminsRoleID, verifiedRoleID, serverName, serverID, lastGameID, playersAmount, stats, client }: 
    { adminsRoleID: string, verifiedRoleID: string, serverName: string, serverID: string, playersAmount: number, lastGameID: number, stats: TServerStats, client: Client }) {
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
    this.playersAmount = playersAmount;
    this.client = client;

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
      type: 'full',
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
        this.playersAmount += 1;
        const newUser = new UserModel({ id: user.id, name: user.name, gamesID: [], history: [], rating: defaultRating });
        await newUser.save();
      }
    }));

    return Res(`Создана игра с ID: **${this.lastGameID}**. Участники: ${usersInGame.map((user) => user.name).join(', ')}`);
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

    if (impostors.length !== 2) {
      return Err(`В игре на 10 человек, должно быть два импостера`);
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
      let diff: number;
      if (playerIs === 'impostor') {
        diff = ratingChange[playerIs][state.impostorsRes];
      } else {
        diff = ratingChange[playerIs][state.impostorsRes === 'lose' ? 'win' : 'lose'];
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
        gameType: state.type,
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

    const res: {
      success: string[],
      error: string[],
    } = {
      success: [],
      error: [],
    }

    await Promise.all(users.map(async (mention) => {
      const user = await UserModel.findOne({ id: mention.id });
      if (!user) {
        res.error.push(msg.guild?.member(mention)?.nickname || mention.user.username);
        return;
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
      res.success.push(msg.guild?.member(mention)?.nickname || mention.user.username);
    }));

    return Res(`${res.success.length ? `Рейтинг юзеров **${res.success.join(', ')}** изменен на ${diff}\n` : ''}${res.error.length ? `Произошла ошибка при обновлении рейтинга: **${res.error.join(', ')}**` : ''}`);
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
        gameType: game.type,
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
      return Err('Мы не смогли найти вашу статистику в базе (Статистика появится после первой рейтинговой игры)');
    }

    let statsMsg = `-------------**Статистика**-------------\n`;
    statsMsg += `Пользователь: ${msg.author.username}\n`
    statsMsg += `Текущий рейтинг: ${user.rating}\n\n`;
    const games = user.history.filter(el => el.reason !== 'manualy' && el.reason !== 'revert') as IGameChangeRating[];
    const stats = {
      skeld: {
        total: { win: 0, lose: 0 },
        impostor: { win: 0, lose: 0 },
        crewmate: { win: 0, lose: 0 },
      },
      polus: {
        total: { win: 0, lose: 0 },
        impostor: { win: 0, lose: 0 },
        crewmate: { win: 0, lose: 0 },
      },
    };
    games.forEach((game) => {
      const result = game.reason as 'win' | 'lose';
      stats[game.map].total[result] += 1;
      stats[game.map][game.team === 'impostors' ? 'impostor' : 'crewmate'][result] += 1;
    });
    const maps: TGameMaps[] = ['skeld', 'polus'];
    for (let map of maps) {
      const mapStats = stats[map];
      const dataMap = [
        ['Общее', 'Impostor', 'Crewmate'],
        [mapStats.total.win + mapStats.total.lose, mapStats.impostor.win + mapStats.impostor.lose, mapStats.crewmate.win + mapStats.crewmate.lose],
        [mapStats.total.win, mapStats.impostor.win, mapStats.crewmate.win],
        [mapStats.total.lose, mapStats.impostor.lose, mapStats.crewmate.lose],
        [calculateWinrate(mapStats.total.win, mapStats.total.lose), calculateWinrate(mapStats.impostor.win, mapStats.impostor.lose), calculateWinrate(mapStats.crewmate.win, mapStats.crewmate.lose)],
      ];

      const optionsMap: TTableOptions = {
        tableTitle: true,
        markdown: 'd',
        data: [
          { rowTitle: 'Team', length: 10 },
          { rowTitle: 'Кол-во игр', length: 10 },
          { rowTitle: 'Побед', length: 10 },
          { rowTitle: 'Поражений', length: 10 },
          { rowTitle: 'Процент побед', length: 14 },
        ]
      };
      statsMsg += `Карта: **${map}**\n` + generateTable(dataMap, optionsMap) + '\n';
    }
    const lastActions = user.history.slice(user.history.length >= 10 ? user.history.length - 10 : 0);
    const dataActions = lastActions.reduce<[string[],string[],string[]]>((acc, action) => {
      const startOfMsg = {
        'manualy': 'Изменен в ручную',
        'revert': 'Возврат за игру',
        'win': 'Победа в игре',
        'lose': 'Поражение в игре',
      }
      acc[0].push(startOfMsg[action.reason]);
      if (action.reason === 'manualy') {
        acc[1].push('')
      } else {
        acc[1].push(String(action.gameID))
      }
      const diff = action.rating.diff < 0 ? action.rating.diff : `+${action.rating.diff}`
      acc[2].push(`${action.rating.before} ${diff}`)
      return acc;
    }, [[],[],[]]);

    const options: TTableOptions = {
      title: `Последние 10 изменений рейтинга`,
      tableTitle: true,
      markdown: 'd',
      data: [
        { rowTitle: 'Действие', length: 18 }, 
        { rowTitle: 'GameID', length: 6 }, 
        { rowTitle: 'Рейтинг', length: 10 },
      ]
    };

    statsMsg += generateTable(dataActions, options);

    try {
      await msg.author.send(statsMsg);
    } catch (e) {
      return Err('Не удалось отправить вам сообщение (Возможно у вас закрыты личные сообщения)');
    }
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
    await this.client.user?.setActivity({
      name: `Игр: ${this.lastGameID} | Игроков: ${this.playersAmount}`,
      type: 'WATCHING',
    });
  }

  private async generateLeaderboard(): Promise<string> {
    const bestUsers = await UserModel.find().sort({ rating: -1 }).limit(usersInLeaderboard);

    const data = bestUsers.reduce<[string[], string[], number[]]>((acc, user, index) => {
      acc[0].push(String(index + 1) + '.');
      acc[1].push(user.name);
      acc[2].push(user.rating);
      return acc;
    }, [[],[],[]]);

    const options: TTableOptions = {
      title: `Лидерборд ТОП-${bestUsers.length}`,
      tableTitle: true,
      markdown: 'd',
      data: [
        { rowTitle: '', length: 3 },
        { rowTitle: 'Никнейм', length: maxNicknameForLeadeboardLength }, 
        { rowTitle: 'Рейтинг', length: 8 }
      ]
    };

    return generateTable(data, options);
  }

  private generateStats(): string {
    let message = `Статистика:\n`;
    const maps: TGameMaps[] = ['skeld', 'polus'];
    for (let map of maps) {
      const mapStats = this.stats[map];
      message += `---------------------------------\n`;
      message += `Карта: ${map}\n`;
      message += `Полные игры (10 человек):\n`;
      message += `Количество игр: ${mapStats.full.amount}\n`;
      message += `Imposters: Побед - ${mapStats.full.imposters_win}, Winrate - ${Math.round(mapStats.full.imposters_win / mapStats.full.amount * 100)} %\n`;
      message += `Crewmates: Побед - ${mapStats.full.crewmates_win}, Winrate - ${Math.round(mapStats.full.crewmates_win / mapStats.full.amount * 100)} %\n\n`;
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