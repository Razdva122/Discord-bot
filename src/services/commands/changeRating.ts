import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res, Err } from "../../utils/response";

import { TAnswer } from "../../types";

// !changeRating [diff] [@user]
export default class ChangeRating extends ServerCommand {
  validateCommand(args: string[]) {
    const [diff] = args;
    if (!diff) {
      return Err('Нужно передать изменение рейтинга');
    }
    if (!Number(diff)) {
      return Err(`Передано не валидное значение ${diff}`);
    }
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const [diff] = args;
    return await server.changeRating(Number(diff), msg);
  }
}
