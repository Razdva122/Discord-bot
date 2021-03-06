import { Message } from 'discord.js';

import { ServerCommand } from './command';
import { Server } from '../server';
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

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const guild = msg.guild!;
    const [roleToChange, newRole] = args;

    const newRoleID = guild.roles.cache.findKey((role) => role.name === newRole);
    if(!newRoleID) {
      return Err(`На сервере нет роли с именем ${newRole}`);
    }
    await server.updateRole((roleToChange as 'admins' | 'verified'), newRoleID);

    return Res(`Роль ${roleToChange} обновлена`);
  }
}