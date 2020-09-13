import { TAPIMethods, TMessageParserMethods, Constructor } from './types';

import { methods } from './consts';

import { Message } from 'discord.js';

interface IMessageParserHelpers {
  parseMessage: (msg: Message) => string | null,
  isCorrectMethod: (str: string) => str is TAPIMethods
}

export const messageParser: TMessageParserMethods & IMessageParserHelpers = {
  parseMessage(msg) {
    if (!msg.content.startsWith('!')) {
      return null;
    }

    const command = msg.content.trim().split(' ');
    // Cut ! from start of string
    command[0] = command[0].slice(1, command[0].length);

    const method = command[0];

    if (!messageParser.isCorrectMethod(method)) {
      return 'Некорректный метод';
    } 
    messageParser[method](...command.slice(1));
  },

  isCorrectMethod(str): str is TAPIMethods {
    return methods.includes(str);
  },

  initServer(): string | null {
    return null;
  }
}
