
import { Message } from 'discord.js';

import { TAPIMethods, TAnswer } from '../types';

import { ServersClaster, Server } from './servers';

import { ServerCommand, ServerlessCommand } from './commands/command';

import { Err, Res } from "../utils/response";
import commands from './commands'

export default class commandController {
  serverClaster: ServersClaster;

  constructor(serverClaster: ServersClaster) {
    this.serverClaster = serverClaster;
  }

  async processMessage(msg: Message): Promise<TAnswer> {
    const [method, ...args] = msg.content.trim().split(' ');

    if (!this.isValidMethod(method)) {
      return Err(`${method} такой команды не существует`);
    }

    const command = commands[method];

    if (args[0] === 'help') {
      return Res(command.help);
    }

    const validateRes = command.validateCommand(args);
    if (validateRes.error) {
      return validateRes;
    }

    if (this.isServerCommand(command)) {
      command
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

      return await command.executeCommand(args, msg, this.serverClaster);
    }
  }

  private isValidMethod(method: string): method is keyof typeof commands {
    return method in commands;
  }

  private isServerCommand(command: ServerCommand | ServerlessCommand): command is ServerCommand {
    return command.type === 'serverdependent';
  }
}
