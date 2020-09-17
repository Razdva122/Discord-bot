import { Client } from 'discord.js';

import mongoose from 'mongoose';

import { botSecretToken, mongoAuth } from './consts/private';

import commandController from './services/commandController';

const client = new Client();

async function start() {
  try {
    await mongoose.connect(`mongodb+srv://${mongoAuth.user}:${mongoAuth.password}@cluster0.nm0xd.mongodb.net/servers`, {
      useNewUrlParser: true,
      useFindAndModify: false,
    });
  } catch (e) {
    console.log(e);
  }
}

start();

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
