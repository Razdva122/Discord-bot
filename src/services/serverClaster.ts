import { TAnswer, IServersFromMongo } from '../types';

import { ServerModel } from '../models';

import { Server }  from './server';

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