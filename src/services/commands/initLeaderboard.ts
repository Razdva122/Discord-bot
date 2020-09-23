import { ServerCommand } from './command';
import { Server } from '../servers';

import { Message } from 'discord.js';

import { Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !initLeaderboard
export default class InitLeaderboard extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    await server.initLeaderboard(msg);
    return Res('Таблица создана');
  }
}
