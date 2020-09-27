import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !initStats
export default class InitStats extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    await server.initStats(msg);
    return Res('Статистика создана');
  }
}
