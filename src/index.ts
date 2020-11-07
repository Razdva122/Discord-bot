import { Client } from 'discord.js';

import mongoose from 'mongoose';

import { settings } from './consts/private';

import { ServerModel } from './models';

import { ServersClaster } from './services/serverClaster';

import CommandController from './services/commandController';

const client = new Client();

async function start() {
  let commandController: CommandController;

  try {
    await mongoose.connect(`mongodb+srv://${settings.mongoUser.user}:${settings.mongoUser.password}@cluster0.nm0xd.mongodb.net/${settings.mongoDB}`, {
      useNewUrlParser: true,
      useFindAndModify: false,
    });

    client.on('ready', async () => {
      console.log(`[INFO] Logged in as ${client.user!.tag}!`);

      const servers = await ServerModel.find({});

      const serverClaster = new ServersClaster(servers.map((server) => {
        return {
          ...server,
        }
      }), client);
  
      commandController = new CommandController(serverClaster);
    });
    
    client.on('message', async (msg) => {
      if (msg.author == client.user) {
        return;
      }
    
      if (msg.channel.type !== 'text') {
        return;
      }
    
      if (!msg.content.startsWith('!')) {
        return;
      }
    
      const commandRes = await commandController.processMessage(msg, client);
      if (commandRes.error) {
        msg.reply(`[ОШИБКА] ${commandRes.error.msg}`)
      } else {
        msg.reply(commandRes.result.data);
      }
    });
    
    client.login(settings.botSecretToken);
  } catch (e) {
    console.log(e);
  }
}

start();


