import { Guild } from 'discord.js';

import { ServerCommand } from './command';
import { Server } from '../servers';
import { Err, Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !updateRoles
export default class UpdateRoles extends ServerCommand {
  validateCommand(args: string[]) {
    return Res('Команда корректна');
  }

  executeCommand(args: string[], guild: Guild, server: Server): TAnswer {
    const updateRoles = server.updateRoles(guild);

    return updateRoles;
  }
}