import { User } from 'discord.js';

import { mainOwnerID, accessLevelToMethods, accessLevel, helpText } from './consts';

import { Server, ServersClaster } from './servers';
import { TAnswer, TMethodsWithServer, TAPIMethodsWithServer, Parameters } from './types';

export default class OpenApi implements TAPIMethodsWithServer {
  readonly mainOwnerID: string = mainOwnerID;

  private userHavePermissions(user: User, server: Server, levelOfPermission: number): boolean {
    let userLevelOfPermissions = accessLevel.all;

    if (server.isUserVerified(user)) {
      userLevelOfPermissions = accessLevel.verified;
    }

    if (server.isUserAdmin(user)) {
      userLevelOfPermissions = accessLevel.admins;
    }

    if (this.checkMainOwnerPermissions(user)) {
      userLevelOfPermissions = accessLevel.owner;
    }

    return levelOfPermission <= userLevelOfPermissions;
  }

  private checkMainOwnerPermissions(user: User): boolean {
    return user.id === mainOwnerID;
  }

  public tryCallMethod<T extends TMethodsWithServer>(user: User, serverID: string, methodName: T, args: Parameters<OpenApi[T]>): TAnswer<any> {
    const requestServer = ServersClaster.getServer(serverID);
    if (requestServer.error) {
      return {
        error: {
          msg: 'Бот еще не запущен на сервере.',
        }
      }
    }

    if (!this.userHavePermissions(user, requestServer.result.data, accessLevelToMethods[methodName])) {
      return {
        error: {
          msg: 'Не достаточно прав для этого действия.',
        }
      }
    }
  
    return this[methodName](...args);
  }

  public initServer(user: User, serverID: string, config: {
    channelID: string,
    roleAdminsID: string,
    roleVerifiedID?: string,
  }): TAnswer<Server> {
    if (this.checkMainOwnerPermissions(user)) {
      return {
        error: {
          msg: 'Только владелец может инициализровать бота.',
        }
      }
    }

    const result = ServersClaster.setNewServer(serverID, new Server(config));
    return result;
  }

  public deleteServer(user: User, serverID: string): TAnswer<string> {
    if (this.checkMainOwnerPermissions(user)) {
      return {
        error: {
          msg: 'Только владелец может удалить бота.',
        }
      }
    }

    const result = ServersClaster.deleteServer(serverID);
    return result;
  }

  public startGame(...args: any[]): TAnswer<string> {
    return {
      error: {
        msg: 'Метод не реализован.',
      }
    }
  }

  public cancelGame(): TAnswer<string> {
    return {
      error: {
        msg: 'Метод не реализован.',
      }
    }
  }

  public endGame(): TAnswer<string> {
    return {
      error: {
        msg: 'Метод не реализован.',
      }
    }
  }

  public deleteGame(): TAnswer<string> {
    return {
      error: {
        msg: 'Метод не реализован.',
      }
    }
  }

  public updateRoles(): TAnswer<string> {
    return {
      error: {
        msg: 'Метод не реализован.',
      }
    }
  }

  public help(): TAnswer<string[]> {
    return {
      result: {
        data: Object.values(helpText),
      }
    }
  }
}