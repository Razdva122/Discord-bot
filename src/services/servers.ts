import { User, Guild, Message } from 'discord.js';

import { TAnswer, IServersFromMongo, TGameResult, IGameFinishState } from '../types';

import { ServerModel, GameStartedModel, GameCanceledModel, UserModel, GameFinishedModel } from '../models';

import { defaultRating, ratingChange, usersInLeaderboard } from '../consts';

import { IUserInGame } from '../models/userInGame';
import { IGameFinished } from '../models/gameFinished';
import { Res, Err } from '../utils/response';

export class ServersClaster {
  private claster: { [key: string] : Server } = {};

  constructor(serversFromMongo: IServersFromMongo[]) {
    serversFromMongo.forEach((serverInfo) => {
      const { adminsRoleID, serverID, verifiedRoleID, name, lastGameID } = serverInfo;
      this.claster[serverID] = new Server({ adminsRoleID, verifiedRoleID, serverName: name, serverID, lastGameID });
    });
  }

  public async setNewServer(serverID: string, server: Server): Promise<TAnswer<Server>> {
    if (this.claster[serverID]) {
      return {
        error: {
          msg: 'Bot already exist on server',
        }
      }
    }

    const createServer = new ServerModel({
      name: server.name,
      id: serverID,
      adminsID: server.users.admins.roleID,
      verifiedID: server.users.verified.roleID,
      lastGameID: 0,
    });
    const res = await createServer.save();
    this.claster[serverID] = server;

    return {
      result: {
        data: this.claster[serverID],
      }
    }
  }

  public getServer(serverID: string): TAnswer<Server> {
    if (this.claster[serverID]) {
      return {
        result: {
          data: this.claster[serverID],
        }
      }
    }

    return {
      error: {
        msg: `Server with ID:${serverID} does not exist`,
      }
    }
  }

  public deleteServer(serverID: string): TAnswer<string> {
    if (this.claster[serverID]) {
      delete this.claster[serverID];
      return {
        result: {
          data: 'Success',
        }
      }
    }

    return {
      error: {
        msg: `Server with ID:${serverID} does not exist`,
      }
    }
  }
}

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

  public async startGame(usersInGame: IUserInGame[]): Promise<TAnswer> {
    this.lastGameID += 1;
    await ServerModel.findOneAndUpdate({ id: this.serverID }, { lastGameID: this.lastGameID });
    const createGame = new GameStartedModel({
      id: this.lastGameID,
      state: 'progress',
      players: usersInGame,
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
      return player.id !== impostors[0].id && player.id !== impostors[0]?.id;
    })

    const finishGame = await this.updateRatingAndFinishGame({
      id: gameID,
      impostorsRes: gameStatus,
      impostors,
      crewmates,
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
        .push({ name: player.name, before: playerFromDB.rating - diff, diff });
    }));

    return Res(gameResult);
  }

  public async cancelGame(gameID: number): Promise<TAnswer> {
    const prevGameState = await GameStartedModel.findOneAndDelete({ id: gameID });
    if (!prevGameState) {
      return Err(`Не найдена игра с ID: ${gameID}`);
    }

    const canceledGame = new GameCanceledModel({
      id: prevGameState.id,
      state: 'canceled',
      players: prevGameState.players,
    });

    await canceledGame.save();

    return Res(`Игра ID: ${gameID} отменена`);
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

  public isUserVerified(user: User, guild: Guild): boolean {
    const role = guild.roles.cache.find((role) => role.id === this.users.verified.roleID);
    return Boolean(role && role.members.has(user.id));
  }

  public isUserAdmin(user: User, guild: Guild) {
    const role = guild.roles.cache.find((role) => role.id === this.users.admins.roleID);
    return Boolean(role && role.members.has(user.id));
  }
}