import { Client, TextChannel } from 'discord.js';

import { ICommand } from './types';

import { botSecretToken } from './private';

const client = new Client();

const init = function([roomName, adminsRole, verifiedRole], user, serverID) {
  if (user.id !== mainOwnerID) {
    console.log('Инициализировать бота может только его владелец.');
    return;
  }

  if (servers[serverID]) {
    console.log('Бот уже запущен на данном сервере.');
    return;
  }

  if (!roomName) {
    console.log('Название комнаты является обязательным параметром. Пример: !init (!Название комнаты!) (Роль Админов) (?Роль Подтвержденных?)');
    return;
  }

  if (!adminsRole) {
    console.log('Роль является обязательным параметром. Пример: !init (Название комнаты) (!Роль Админов!) (?Роль Подтвержденных?)');
    return;
  }
  console.log('Init method');


} as ICommand;

init.help = 'Инициализирует бота на сервере\n!init (Название комнаты для бота) (Роль Админов - максимальный уровень доступа) (Роль Подтвержденных - средний уровень доступа)';
init.access = 'owner';

const commands: { [key: string]: ICommand } = {
  '!init': init,
}

client.on('ready', () => {
  console.log(`[INFO] Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  msg.channel
  if (!msg.content.startsWith('!')) {
    return;
  }

  const [command, ...props] = msg.content.split(' ');
  if (commands[command]) {
    console.log(`Valid command ${command}`);
    if (props.length === 0) {
      console.log(commands[command].help);
    } else {
      console.log(msg);
      commands[command](props, msg.author, (msg.channel as TextChannel).guild.id);
    }
  } else {
    console.log(`Unvalid command ${command}`);
  }
});

client.login(botSecretToken);
