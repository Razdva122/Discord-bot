import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !stats
export default class Stats extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    return await server.getStats(msg);
  }
}
