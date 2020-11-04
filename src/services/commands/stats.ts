import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Err, Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !stats
export default class Stats extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const serverBoosterRole = msg.guild!.roles.cache.find((role) => role.name === 'Server Booster');
    if (args[0] === 'show' && !serverBoosterRole?.members.find((el) => el === msg.guild?.member(msg.author))) {
      return Err(`Команда stats show доступна только для Server Booster`);
    }
    return await server.getStats(msg, args[0] === 'show');
  }
}
