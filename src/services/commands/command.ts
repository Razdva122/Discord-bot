import { User, Guild } from "discord.js";

import { mainOwnerID, accessLevel } from "../../consts/index";

import { TAnswer } from "../../types";
import { Server } from '../servers';

export abstract class Command {
  levelOfPermission: number;
  helpMessage: string;

  constructor(levelOfPermission: number, helpMessage: string) {
    this.levelOfPermission = levelOfPermission;
    this.helpMessage = helpMessage;
  }

  public get help(): string {
    return this.helpMessage;
  };

  abstract validateCommand(args: string[]): TAnswer;

  public validateOwnerPermission(user: User): TAnswer {
    if (user.id === mainOwnerID) {
      return {
        result: {
          data: 'Юзер является Ownerом',
        }
      }
    }

    return {
      error: {
        msg: 'Необходим доступ уровня Owner',
      }
    }
  }

  abstract processCommand(args: string[], guild: Guild, server?: Server): TAnswer
}

export abstract class CommandToServer extends Command {
  public validatePermission(user: User, server: Server): TAnswer {
    let userLevelOfPermissions = accessLevel.all;

    if (server.isUserVerified(user)) {
      userLevelOfPermissions = accessLevel.verified;
    }

    if (server.isUserAdmin(user)) {
      userLevelOfPermissions = accessLevel.admins;
    }

    if (this.validateOwnerPermission(user)) {
      userLevelOfPermissions = accessLevel.owner;
    }

    if (this.levelOfPermission <= userLevelOfPermissions) {
      return {
        result: {
          data: 'Доступ разрешен',
        }
      }
    }

    return {
      error: {
        msg: 'Не достаточно прав для данной команды',
      }
    }
  }

  abstract processCommand(args: string[], guild: Guild, server: Server): TAnswer
}
