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
      usersID: string[],
    },
    verified: {
      roleID: string,
      usersID: string[],
    }
  }
  
  constructor({ adminsRoleID, verifiedRoleID, guild }: { adminsRoleID: string, verifiedRoleID: string, guild: Guild }) {
    const adminsIDs = this.getUsersIDsByRoleID(guild, adminsRoleID);
    const verifiedIDs = this.getUsersIDsByRoleID(guild, verifiedRoleID);
    this.users = {
      admins: {
        roleID: adminsRoleID,
        usersID: adminsIDs,
      },
      verified: {
        roleID: verifiedRoleID,
        usersID: verifiedIDs,
      }
    }
  }

  private getUsersIDsByRoleID(guild: Guild, roleID: string): string[] {
    return guild.members.cache
      .filter((user) => user.roles.cache.has(roleID))
      .map((user) => user.id)
  }

  public isUserVerified(user: User): boolean {
    return this.users.verified.usersID.includes(user.id);
  }

  public isUserAdmin(user: User) {
    return this.users.admins.usersID.includes(user.id);
  }

  public updateRoles(guild: Guild): TAnswer {
    if (!guild.roles.cache.has(this.users.admins.roleID) || !guild.roles.cache.has(this.users.verified.roleID)) {
      return {
        error: {
          msg: 'ID ролей изменилось невозможно обновить роли',
        }
      }
    }

    this.users.admins.usersID = this.getUsersIDsByRoleID(guild, this.users.admins.roleID);
    this.users.verified.usersID = this.getUsersIDsByRoleID(guild, this.users.verified.roleID);

    return {
      result: {
        data: 'Роли успешно обновлены',
      }
    }
  }
}