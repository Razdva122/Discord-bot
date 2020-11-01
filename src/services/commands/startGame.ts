import { ServerCommand } from './command';
import { Server } from '../server';

import { Message } from 'discord.js';

import { Res, Err } from "../../utils/response";

import { TAnswer, TGameMaps } from "../../types";

// !startGame roomName gameMap
export default class StartGame extends ServerCommand {
  validateCommand(args: string[]) {
    const [roomName, gameMap] = args;
    if (!roomName) {
      return Err('Нужно передать название канала в котором стартует игра');
    }
    if (!gameMap) {
      return Err('Нужно передать название карты на которой начинается игра **skeld** или **polus**');
    }
    const mapNormalized = gameMap.toLowerCase();
    if (mapNormalized !== 'skeld' && mapNormalized !== 'polus') {
      return Err('Карты доступные для игры **skeld** или **polus**');
    }
    return Res('Команда корректна');
  }

  async executeCommand(args: string[], msg: Message, server: Server): Promise<TAnswer> {
    const guild = msg.guild!;
    const [roomName, gameMap] = args;

    const room = guild.channels.cache.find((channel) => channel.type === 'voice' && channel.name === roomName);
    if (!room) {
      return Err(`Не смогли найти комнату с именем ${roomName}`);
    }
    const channelMembers = room.members.array().map((member) => ({
      id: member.id,
      name: member.guild.member(member)?.nickname || member.user.username,
    }));

    if (channelMembers.length !== 10) {
      return Err(`Игру можно начать только на 10 человек. В комнате сейчас ${channelMembers.length}`);
    }

    return await server.startGame(gameMap.toLowerCase() as TGameMaps, channelMembers, msg);
  }
}
