import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res } from "../../utils/response";

import { TAnswer } from "../../types";
import { additionalRoles } from "../../consts";

// !resetStats
export default class ResetStats extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const donateRole = msg.guild!.roles.cache.find((role) => role.name === additionalRoles.donate);
    const legacyRole = msg.guild!.roles.cache.find((role) => role.name === additionalRoles.legacy);
    const userIsDonate = donateRole?.members.find((el) => el === msg.guild?.member(msg.author));
    const userIsLegacy = legacyRole?.members.find((el) => el === msg.guild?.member(msg.author));
    let amountOfResets = 2;
    if (userIsDonate) {
      amountOfResets += 1;
    }

    if (userIsLegacy) {
      amountOfResets += 1;
    }
    return await server.resetStats(msg, amountOfResets);
  }
}
