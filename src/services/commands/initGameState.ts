import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !initGameState
export default class InitGameState extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    await server.initGameState(msg);
    return Res('Таблица создана');
  }
}
