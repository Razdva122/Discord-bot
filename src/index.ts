import { Client, TextChannel } from 'discord.js';

import { botSecretToken } from './consts/private';

const client = new Client();

client.on('ready', () => {
  console.log(`[INFO] Logged in as ${client.user!.tag}!`);
});

client.on('message', msg => {
  if (msg.channel.type !== 'text') {
    return;
  }

  console.log(msg.channel.guild.members);

  if (!msg.content.startsWith('!')) {
    return;
  }
});

client.login(botSecretToken);
