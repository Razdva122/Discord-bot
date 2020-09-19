import { User, Guild } from 'discord.js';

import { TAnswer, IServersFromMongo } from '../types';

import { ServerModel } from '../models';

export class ServersClaster {
  private claster: { [key: string] : Server } = {};

  constructor(serversFromMongo: IServersFromMongo[]) {
    serversFromMongo.forEach((serverInfo) => {
      const { adminsRoleID, serverID, verifiedRoleID} = serverInfo;
      this.claster[serverID] = new Server({ adminsRoleID, verifiedRoleID });
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
      serverID,
      adminsID: server.users.admins.roleID,
      verifiedID: server.users.verified.roleID,
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
  users: { 
    admins: {
      roleID: string,
    },
    verified: {
      roleID: string,
    }
  }
  
  constructor({ adminsRoleID, verifiedRoleID }: { adminsRoleID: string, verifiedRoleID: string }) {
    this.users = {
      admins: {
        roleID: adminsRoleID,
      },
      verified: {
        roleID: verifiedRoleID,
      }
    }
  }

  public updateRole(roleToChange: 'admins' | 'verified', newRoleID: string) {
    this.users[roleToChange].roleID === newRoleID;
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