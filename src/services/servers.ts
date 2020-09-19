import { User, Guild } from 'discord.js';

import { TAnswer } from '../types';

export class ServersClaster {
  private static claster: { [key: string] : Server } = {};

  public static setNewServer(serverId: string, server: Server): TAnswer<Server> {
    if (this.claster[serverId]) {
      return {
        error: {
          msg: 'Bot already exist on server',
        }
      }
    }

    this.claster[serverId] = server;

    return {
      result: {
        data: this.claster[serverId],
      }
    }
  }

  public static getServer(serverId: string): TAnswer<Server> {
    if (this.claster[serverId]) {
      return {
        result: {
          data: this.claster[serverId],
        }
      }
    }

    return {
      error: {
        msg: `Server with ID:${serverId} does not exist`,
      }
    }
  }

  public static deleteServer(serverId: string): TAnswer<string> {
    if (this.claster[serverId]) {
      delete this.claster[serverId];
      return {
        result: {
          data: 'Success',
        }
      }
    }

    return {
      error: {
        msg: `Server with ID:${serverId} does not exist`,
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