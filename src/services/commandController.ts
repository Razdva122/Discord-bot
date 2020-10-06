
import { Message, Client } from 'discord.js';

import { TAnswer } from '../types';

import { ServersClaster } from './serverClaster';

import { ServerCommand, ServerlessCommand } from './commands/command';

import { Err, Res } from "../utils/response";
import commands from './commands'

export default class commandController {
  serverClaster: ServersClaster;

  constructor(serverClaster: ServersClaster) {
    this.serverClaster = serverClaster;
  }

  async processMessage(msg: Message, client: Client): Promise<TAnswer> {
    const [method, ...args] = msg.content.replace(/  +/g, ' ').trim().split(' ');

    const methodNormalized = method.toLowerCase();

    if (!this.isValidMethod(methodNormalized)) {
      return Err(`${method} такой команды не существует`);
    }

    const command = commands[methodNormalized];

    if (args[0] === 'help') {
      return Res(command.help);
    }

    const validateRes = command.validateCommand(args);
    if (validateRes.error) {
      return validateRes;
    }

    if (this.isServerCommand(command)) {
      const serverRes = this.serverClaster.getServer(msg.guild!.id);
      if (serverRes.error) {
        return serverRes;
      }

      const server = serverRes.result.data;

      const permissionRes = command.validatePermission(msg.author, server, msg.guild!);
      if (permissionRes.error) {
        return permissionRes;
      }

      return await command.executeCommand(args, msg, server);
    } else {
      const permissionRes = command.validateOwnerPermission(msg.author);
      if (permissionRes.error) {
        return permissionRes;
      }

      return await command.executeCommand(args, msg, this.serverClaster, client);
    }
  }

  private isValidMethod(method: string): method is keyof typeof commands {
    return method in commands;
  }

  private isServerCommand(command: ServerCommand | ServerlessCommand): command is ServerCommand {
    return command.type === 'serverdependent';
  }
}
