import { Guild } from 'discord.js';

import { Command } from './command';
import { ServersClaster, Server } from '../servers';

import { TAnswer } from "../../types";

// !initServer [Роль админов] [Роль верифицированных игроков]
export default class InitServer extends Command {
  validateCommand([adminsRole, verifiedRole]: string[]) {
    if (!adminsRole) {
      return {
        error: {
          msg: 'Нужно передать роль админа',
        }
      }
    }

    if (!verifiedRole) {
      return {
        error: {
          msg: 'Нужно передать роль верифицированных игроков',
        }
      }
    }

    return {
      result: {
        data: 'Команда корректна',
      }
    }
  }

  processCommand(args: string[], guild: Guild): TAnswer {
    const [adminsRole, verifiedRole] = args;

    const adminsRoleID = guild.roles.cache.findKey((role) => role.name === adminsRole);
    const verifiedRoleID = guild.roles.cache.findKey((role) => role.name === verifiedRole);
    if(!adminsRoleID) {
      return {
        error: {
          msg: `На сервере нет роли с именем ${adminsRole}`,
        }
      }
    }

    if(!verifiedRoleID) {
      return {
        error: {
          msg: `На сервере нет роли с именем ${verifiedRole}`,
        }
      }
    }

    const createServer = ServersClaster.setNewServer(guild.id, new Server({ adminsRoleID, verifiedRoleID, guild }));
    if (createServer.error) {
      return createServer;
    }

    return {
      result: {
        data: 'Сервер успешно инициализирован',
      }
    }
  }
}