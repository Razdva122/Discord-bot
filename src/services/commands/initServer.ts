import { Guild } from 'discord.js';

import { ServerlessCommand } from './command';
import { ServersClaster, Server } from '../servers';
import { Err, Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !initServer [Роль админов] [Роль верифицированных пользователей]
export default class InitServer extends ServerlessCommand {
  validateCommand([adminsRole, verifiedRole]: string[]) {
    if (!adminsRole) {
      return Err('Нужно передать роль админа')
    }

    if (!verifiedRole) {
      return Err('Нужно передать роль верифицированных пользователей');
    }

    return Res('Команда корректна');
  }

  async executeCommand(args: string[], guild: Guild, ServersClaster: ServersClaster): Promise<TAnswer> {
    const [adminsRole, verifiedRole] = args;

    const adminsRoleID = guild.roles.cache.findKey((role) => role.name === adminsRole);
    const verifiedRoleID = guild.roles.cache.findKey((role) => role.name === verifiedRole);
    if(!adminsRoleID) {
      return Err(`На сервере нет роли с именем ${adminsRole}`);
    }

    if(!verifiedRoleID) {
      return Err(`На сервере нет роли с именем ${verifiedRole}`);
    }

    const createServer = await ServersClaster.setNewServer(guild.id, new Server({ adminsRoleID, verifiedRoleID }));
    if (createServer.error) {
      return createServer;
    }

    return Res('Сервер успешно инициализирован');
  }
}