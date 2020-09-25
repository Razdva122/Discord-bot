import { ServerCommand } from './command';
import { Server } from '../servers';

import { Message } from 'discord.js';

import { Res, Err } from "../../utils/response";

import { TAnswer } from "../../types";

// !gameHistory [gameID]
export default class GameHistory extends ServerCommand {
  validateCommand(args: string[]) {
    const [gameID] = args;
    if (!gameID) {
      return Err('Нужно передать ID игры историю которой вы хотите получить');
    }
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const [gameID] = args;
    return await server.gameHistory(Number(gameID));
  }
}
