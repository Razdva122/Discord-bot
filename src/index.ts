import { Client } from 'discord.js';

import mongoose from 'mongoose';

import { botSecretToken, mongoAuth } from './consts/private';

import { ServerModel } from './models';

import { ServersClaster } from './services/servers';

import CommandController from './services/commandController';

const client = new Client();

async function start() {
  try {
    await mongoose.connect(`mongodb+srv://${mongoAuth.user}:${mongoAuth.password}@cluster0.nm0xd.mongodb.net/amongbot`, {
      useNewUrlParser: true,
      useFindAndModify: false,
    });

    const servers = await ServerModel.find({});

    const serverClaster = new ServersClaster(servers.map((server) => {
      return {
        name: server.name,
        serverID: server.id,
        adminsRoleID: server.adminsID,
        verifiedRoleID: server.verifiedID,
        lastGameID: server.lastGameID,
      }
    }));

    const commandController = new CommandController(serverClaster);

    client.on('ready', () => {
      console.log(`[INFO] Logged in as ${client.user!.tag}!`);
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
    
      const commandRes = await commandController.processMessage(msg);
      if (commandRes.error) {
        msg.reply(`[ОШИБКА] ${commandRes.error.msg}`)
      } else {
        msg.reply(commandRes.result.data);
      }
    });
    
    client.login(botSecretToken);
  } catch (e) {
    console.log(e);
  }
}

start();


