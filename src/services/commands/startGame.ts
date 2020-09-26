import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res, Err } from "../../utils/response";

import { TAnswer } from "../../types";

// !startGame roomName
export default class StartGame extends ServerCommand {
  validateCommand(args: string[]) {
    const [roomName] = args;
    if (!roomName) {
      return Err('Нужно передать название канала в котором стартует игра');
    }
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const guild = msg.guild!;
    const [roomName] = args;

    const room = guild.channels.cache.find((channel) => channel.type === 'voice' && channel.name === roomName);
    if (!room) {
      return Err(`Не смогли найти комнату с именем ${roomName}`);
    }
    const channelMembers = room.members.array().map((member) => ({
      id: member.id,
      name: member.user.username
    }));

    if (channelMembers.length !== 5 && channelMembers.length !== 10) {
      return Err(`Игру можно начать только на 5 или 10 человек. В комнате сейчас ${channelMembers.length}`);
    }

    return await server.startGame(channelMembers, msg);
  }
}
