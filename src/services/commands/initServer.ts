import { Message } from 'discord.js';

import { ServerlessCommand } from './command';
import { Server } from '../server';
import { ServersClaster } from '../serverClaster';
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

  async executeCommand(args: string[], msg: Message, ServersClaster: ServersClaster): Promise<TAnswer> {
    const guild = msg.guild!;
    const [adminsRole, verifiedRole] = args;

    const adminsRoleID = guild.roles.cache.findKey((role) => role.name === adminsRole);
    const verifiedRoleID = guild.roles.cache.findKey((role) => role.name === verifiedRole);
    if(!adminsRoleID) {
      return Err(`На сервере нет роли с именем ${adminsRole}`);
    }

    if(!verifiedRoleID) {
      return Err(`На сервере нет роли с именем ${verifiedRole}`);
    }

    const serverName = guild.name;

    const createServer = await ServersClaster.setNewServer(guild.id, 
      new Server({ 
        adminsRoleID, 
        verifiedRoleID, 
        serverName, 
        serverID: guild.id, 
        lastGameID: 0,
        stats: {
          skeld: {
            mini: {
              amount: 0,
              imposters_win: 0,
              crewmates_win: 0,
            },
            full: {
              amount: 0,
              imposters_win: 0,
              crewmates_win: 0,
            },
          },
          polus: {
            mini: {
              amount: 0,
              imposters_win: 0,
              crewmates_win: 0,
            },
            full: {
              amount: 0,
              imposters_win: 0,
              crewmates_win: 0,
            },
          },
        }, 
      }));
    if (createServer.error) {
      return createServer;
    }

    return Res('Сервер успешно инициализирован');
  }
}