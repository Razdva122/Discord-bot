import { Message } from 'discord.js';

import { ServerCommand } from './command';
import { Server } from '../server';
import { Err, Res } from "../../utils/response";

import { TAnswer, TGameResult } from "../../types";

// !endGame [gameID] [win | loss] [@imposter1] [@imposter2]
export default class EndGame extends ServerCommand {
  validateCommand(args: string[]) {
    const [gameID, gameStatus] = args;
    if (!gameID) {
      return Err('Нужно передать ID игры которую хотите закончить');
    }

    if (!gameStatus) {
      return Err('Нужно передать результат игры (win) победа импостеров или (lose) поражение');
    }

    if (gameStatus !== 'win' && gameStatus !== 'lose') {
      return Err('Статус игры принимает параметр формата [win или lose]');
    }
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const [gameID, gameStatus] = args;

    return await server.endGame(Number(gameID), (gameStatus as TGameResult), msg);
  }
}