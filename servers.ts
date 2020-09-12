import { TAnswer, TAccessLevel } from './types';

import { mainOwnerID } from './consts';

import { User } from 'discord.js';

export class ServersClaster {
  private static claster: { [key: string] : Server }

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
  readonly channelID: string
  readonly roleAdminsID: string
  readonly adminsIDs: string[] = [];
  readonly verifiedIDs: string[] = [];
  readonly roleVerifiedID: string
  readonly mainOwnerID: string = mainOwnerID;

  users: { 
    owner: {
      ownerID: string,
    },
    admins: {
      roleID: string,
      usersID: string[],
    },
    verified?: {
      roleID: string,
      usersID: string[],
    }
  }

  constructor({ channelID, roleAdminsID, roleVerifiedID }: { channelID: string, roleAdminsID: string, roleVerifiedID?: string }) {
    this.channelID = channelID;
    this.roleAdminsID = roleAdminsID;
    this.roleVerifiedID = roleVerifiedID;
  }

  public isUserVerified(user: User): boolean {
    const { verified } = this.users;
    return verified ? verified.usersID.includes(user.id) : false;
  }

  public isUserAdmin(user: User) {
    return this.users.admins.usersID.includes(user.id);
  }

  public updateRoles(adminsIDs: string[], verifiedIDs?: string[]) {
    this.users.admins.usersID = adminsIDs;

    if (this.users.verified && verifiedIDs) {
      this.users.verified.usersID = verifiedIDs;
    }
  }
}