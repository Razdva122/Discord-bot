import { User, Guild, Message } from "discord.js";

import { mainOwnerID, accessLevel } from "../../consts/index";

import { TAnswer } from "../../types";
import { Err, Res } from "../../utils/response";
import { Server } from '../server';
import { ServersClaster } from '../serverClaster';

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
      return Res('Юзер является Ownerом');
    }

    return Err('Необходим доступ уровня Owner');
  }
}

export abstract class ServerlessCommand extends Command {
  type = 'serverless';

  abstract async executeCommand(args: string[], msg: Message, serversClaster: ServersClaster): Promise<TAnswer>
}

export abstract class ServerCommand extends Command {
  type = 'serverdependent';

  public validatePermission(user: User, server: Server, guild: Guild): TAnswer {
    let userLevelOfPermissions = accessLevel.all;

    if (server.isUserVerified(user, guild)) {
      userLevelOfPermissions = accessLevel.verified;
    }

    if (server.isUserAdmin(user, guild)) {
      userLevelOfPermissions = accessLevel.admins;
    }

    if (this.validateOwnerPermission(user)) {
      userLevelOfPermissions = accessLevel.owner;
    }

    if (this.levelOfPermission <= userLevelOfPermissions) {
      return Res('Доступ разрешен');
    }

    return Err('Не достаточно прав для данной команды');
  }

  abstract async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer>
}
