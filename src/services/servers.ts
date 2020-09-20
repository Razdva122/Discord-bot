import { User, Guild } from 'discord.js';

import { TAnswer, IServersFromMongo } from '../types';

import { ServerModel } from '../models';

import { IUserInGame } from '../models/game';
import { Res } from '../utils/response';

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
    return Res(`Создана игра с ID: ${this.lastGameID}`);
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