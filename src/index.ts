import { Client, TextChannel } from 'discord.js';

import { botSecretToken } from './consts/private';

import commandController from './services/commandController';

const client = new Client();

client.on('ready', () => {
  console.log(`[INFO] Logged in as ${client.user!.tag}!`);
});

client.on('message', msg => {
  if (msg.author == client.user) {
    return;
  }

  if (msg.channel.type !== 'text') {
    return;
  }

  if (!msg.content.startsWith('!')) {
    return;
  }

  console.log(msg.content);
  const commandRes = commandController.processMessage(msg);
  if (commandRes.error) {
    msg.channel.send(`[ОШИБКА] ${commandRes.error.msg}`);
  } else {
    msg.channel.send(`[УСПЕХ] ${commandRes.result.data}`);
  }
});

client.login(botSecretToken);
