import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res, Err } from "../../utils/response";

import { TAnswer } from "../../types";

// !cancelGame [gameID]
export default class CancelGame extends ServerCommand {
  validateCommand(args: string[]) {
    const [gameID] = args;
    if (!gameID) {
      return Err('Нужно передать ID игры которую хотите отменить');
    }
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const [gameID] = args;
    return await server.cancelGame(Number(gameID), msg);
  }
}
