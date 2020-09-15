import { Guild } from 'discord.js';

import { CommandToServer } from './command';
import { ServersClaster, Server } from '../servers';

import { TAnswer } from "../../types";

export default class updateRoles extends CommandToServer {
  validateCommand(args: string[]) {
    return {
      result: {
        data: 'Команда корректна',
      }
    }
  }
}