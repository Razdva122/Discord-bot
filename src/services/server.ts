import { User, Guild, Message } from 'discord.js';

import { TAnswer, IServersFromMongo, TGameResult, IGameFinishState } from '../types';

import {
  ServerModel, GameStartedModel, GameCanceledModel, 
  UserModel, GameFinishedModel, IGameCanceled,
  IGameFinished, IGameStarted, GameDeletedModel, IGameDeleted,
} from '../models';

import { defaultRating, ratingChange, usersInLeaderboard } from '../consts';

import { IShortUser } from '../models/shortUser';
import { Res, Err } from '../utils/response';

export class Server {
  readonly serverID: string
  private leaderboardMsg: null | Message = null;
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
  
  constructor({ adminsRoleID, verifiedRoleID, serverName, serverID, lastGameID }: 
    { adminsRoleID: string, verifiedRoleID: string, serverName: string, serverID: string, lastGameID?: number }) {
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
    this.lastGameID = lastGameID || 0;
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

  public async startGame(usersInGame: IShortUser[], msg: Message): Promise<TAnswer> {
    this.lastGameID += 1;
    await ServerModel.findOneAndUpdate({ id: this.serverID }, { lastGameID: this.lastGameID });
    const createGame = new GameStartedModel({
      id: this.lastGameID,
      state: 'progress',
      players: usersInGame,
      started_by: {
        name: msg.author.username,
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

    if (prevGameState.players.length === 5) {
      if (impostors.length !== 1) {
        return Err(`В игре на 5 человек, должен быть один импостер`);
      }
    }

    if (prevGameState.players.length === 10) {
      if (impostors.length !== 2) {
        return Err(`В игре на 10 человек, должно быть два импостера`);
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
      impostorsRes: gameStatus,
      impostors,
      crewmates,
      started_by: deletePrevGame.started_by,
      finished_by: {
        name: msg.author.username,
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

    this.updateLeaderboard();

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
      const playerIsImpostor = state.impostors.some((impostor) => impostor.id === player.id);
      const diff = playerIsImpostor 
        ? state.impostorsRes === 'win' ? ratingChange.impostor : -ratingChange.impostor
        : state.impostorsRes === 'lose' ? ratingChange.crewmate : -ratingChange.crewmate;
      const playerFromDB = await UserModel.findOne({ id: player.id });

      if (!playerFromDB) {
        console.log(`Error updateRatingAndFinishGame ID:${player.id} dont updated`);
        return;
      }

      playerFromDB.rating += diff;
      playerFromDB.gamesID.push(state.id);
      playerFromDB.history.push({
        reason: playerIsImpostor ? state.impostorsRes : crewmatesRes[state.impostorsRes],
        gameID: state.id,
        rating: {
          before: playerFromDB.rating - diff,
          after: playerFromDB.rating,
          diff,
        },
      });

      await playerFromDB.save();

      gameResult.result[playerIsImpostor ? 'impostors' : 'crewmates']
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
      players: prevGameState.players,
      started_by: prevGameState.started_by,
      canceled_by: {
        name: msg.author.username,
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
      result: prevGameState.result,
      state: 'deleted',
      started_by: prevGameState.started_by,
      finished_by: prevGameState.finished_by,
      deleted_by: {
        name: msg.author.username,
        id: msg.author.id,
      }
    });

    await deletedGame.save();

    return Res(`Игра ID: ${gameID} удалена, рейтинг был возвращен`);
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
        gameID: game.id,
        rating: {
          before: user.rating + diff,
          after: user.rating,
          diff,
        }
      });
      await user.save();
    }));

    await this.updateLeaderboard();

    return Res('Рейтинг возвращен');
  }

  public async initLeaderboard(msg: Message): Promise<void> {
    const leaderboard = await this.generateLeaderboard();
    this.leaderboardMsg = await msg.channel.send(leaderboard);
  }

  private async updateLeaderboard(): Promise<void> {
    if (!this.leaderboardMsg) {
      return;
    }
    const leaderboard = await this.generateLeaderboard();

    await this.leaderboardMsg.edit(leaderboard);
  }

  private async generateLeaderboard() {
    const bestUsers = await UserModel.find().sort({ rating: -1 }).limit(usersInLeaderboard);

    const positions = bestUsers.map((user, index) => index + 1).join('\n');
    const nicknames = bestUsers.map((user) => user.name).join('\n');
    const rating = bestUsers.map((user) => user.rating).join('\n');

    return { embed: {
        color: 3447003,
        title: `__**Лидерборд ТОП-${bestUsers.length}**__`,
        fields: [
          { name: "Позиция", value: positions, inline: true},
          { name: "Никнейм", value: nicknames, inline: true},
          { name: "Рейтинг", value: rating, inline: true},
        ]
      }
    };
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
      started: 'В прогрессе',
      finished: 'Завершена',
      deleted: 'Удалена',
    };
    message += `Статус: ${statusMap[game.state]}\n`;
    if (game.state === 'canceled' || game.state === 'started') {
      message += `Участники: *${game.players.map((p) => p.name).join(', ')}*\n`;
    } else {
      message += `Crewmates: *${game.crewmates.map((p) => p.name).join(', ')}*\n`;
      message += `Impostors: *${game.impostors.map((p) => p.name).join(', ')}*\n`;
    }
    message += `Начал игру: ${game.started_by?.name}\n`;
    if (game.state === 'finished' || game.state === 'deleted') {
      message += `Закончил игру: ${game.finished_by?.name}\n`;
      message += `Результат: Победа ${game.win === 'crewmates' ? 'Crewmates' : 'Impostors'}\n`;
    }
    if (game.state === 'deleted') {
      message += `Удалил игру: ${game.deleted_by.name}\n`;
    }
    if (game.state === 'canceled') {
      message += `Отменил игру: ${game.canceled_by?.name}\n`;
    }
    return Res(message);
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