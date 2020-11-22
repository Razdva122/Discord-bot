import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res } from "../../utils/response";

import { TAnswer } from "../../types";
import { additionalRoles, amountOfResets } from "../../consts";

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
    let totalResets = amountOfResets.default;
    if (userIsDonate) {
      totalResets += amountOfResets.donate;
    }

    if (userIsLegacy) {
      totalResets += amountOfResets.legacy;
    }
    return await server.resetStats(msg, totalResets);
  }
}
