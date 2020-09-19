import { Guild } from 'discord.js';

import { ServerCommand } from './command';
import { Server } from '../servers';
import { Err, Res } from "../../utils/response";

import { TAnswer } from "../../types";

// !updateRole [admins | verified] [Новая роль]
export default class UpdateRole extends ServerCommand {
  validateCommand(args: string[]) {
    const [roleName] = args;
    if (roleName !== 'admins' && roleName !== 'verified') {
      return Err('Изменить можно только роль admins или verified');
    }
    return Res('Команда корректна');
  }

  executeCommand(args: string[], guild: Guild, server: Server): TAnswer {
    const [roleToChange, newRole] = args;

    const newRoleID = guild.roles.cache.findKey((role) => role.name === newRole);
    if(!newRoleID) {
      return Err(`На сервере нет роли с именем ${newRole}`);
    }
    server.updateRole((roleToChange as 'admins' | 'verified'), newRoleID);

    return Res(`Роль ${roleToChange} обновлена`);
  }
}