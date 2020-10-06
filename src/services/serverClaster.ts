import { TAnswer, IServersFromMongo } from '../types';

import { ServerModel, UserModel } from '../models';

import { Server }  from './server';
import { Client } from 'discord.js';

export class ServersClaster {
  private claster: { [key: string] : Server } = {};

  constructor(serversFromMongo: IServersFromMongo[], client: Client) {
    serversFromMongo.forEach(async (serverInfo) => {
      const playersAmount = await UserModel.countDocuments({});
      const { adminsRoleID, serverID, verifiedRoleID, name, lastGameID, stats } = serverInfo;
      this.claster[serverID] = new Server({ adminsRoleID, verifiedRoleID, serverName: name, serverID, lastGameID, stats, playersAmount, client });
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
      stats: server.stats,
      lastGameID: server.lastGameID,
      playersAmount: server.playersAmount,
    });
    await createServer.save();
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