import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Err, Res } from "../../utils/response";

import { TAnswer } from "../../types";
import { additionalRoles } from "../../consts";

// !stats
export default class Stats extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const defaultOutput = 10;
    const showOption = args.some((el) => el === 'show');
    const amountOfOperations: number = Number(args.find((el) => Number(el))) || defaultOutput;

    const donateRole = msg.guild!.roles.cache.find((role) => role.name === additionalRoles.donate);
    const legacyRole = msg.guild!.roles.cache.find((role) => role.name === additionalRoles.legacy);
    const userIsDonate = donateRole?.members.find((el) => el === msg.guild?.member(msg.author));
    const userIsLegacy = legacyRole?.members.find((el) => el === msg.guild?.member(msg.author));
    if (amountOfOperations > 50) {
      return Err(`Максимальное количество операций 50`);
    }

    if (amountOfOperations !== defaultOutput && (!userIsLegacy && !userIsDonate)) {
      return Err(`Только люди с ролью ${additionalRoles.donate} или ${additionalRoles.legacy} могут использовать дополнительный параметр`);
    }
    
    if (showOption && !userIsDonate) {
      return Err(`Команда stats show доступна только для ${additionalRoles.donate}`);
    }
    return await server.getStats(msg, showOption, amountOfOperations);
  }
}
