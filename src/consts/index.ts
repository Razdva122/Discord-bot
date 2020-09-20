import { TAccessLevel, ValuesOf, TAPIMethods } from '../types';

export const defaultRating = 2000;

export const gameChangeRating = 25;

export const accessLevel: { readonly [key in TAccessLevel]: number } = {
  all: 0,
  verified: 1,
  admins: 2,
  owner: 3,
};

export const helpLevel: { readonly [key in ValuesOf<typeof accessLevel>]: string } = {
  0: 'Все',
  1: 'Верифицированные',
  2: 'Админы',
  3: 'Владелец',
};

export const accessLevelToMethods: { readonly [key in TAPIMethods]: number } = {
  'initServer': accessLevel.owner,
  'updateRole': accessLevel.owner,
  'deleteGame': accessLevel.admins,
  'startGame': accessLevel.verified,
  'cancelGame': accessLevel.verified,
  'endGame': accessLevel.verified,
  'help': accessLevel.all,
}

export const methods = Object.keys(accessLevelToMethods);

export const helpText: { readonly [key in TAPIMethods]: string } = {
  'initServer': `{${helpLevel[accessLevelToMethods.initServer]}} Инициализировать бота`,
  'updateRole': `{${helpLevel[accessLevelToMethods.updateRole]}} Обновить роль`,
  'deleteGame': `{${helpLevel[accessLevelToMethods.deleteGame]}} Удалить игру`,
  'startGame': `{${helpLevel[accessLevelToMethods.startGame]}} Начать игру`,
  'cancelGame': `{${helpLevel[accessLevelToMethods.cancelGame]}} Отменить игру`,
  'endGame': `{${helpLevel[accessLevelToMethods.endGame]}} Закончить игру`,
  'help': `{${helpLevel[accessLevelToMethods.help]}} Помощь`,
}

export const commandHelp: { readonly [key in TAPIMethods]: string } = {
  'initServer': `!initServer [Роль админов] [Роль верифицированных пользователей]`,
  'updateRole': `!updateRole [admins или verified] [Новая роль]`,
  'deleteGame': `!deleteGame [gameID]`,
  'startGame': `!startGame [Название голосовой комнаты]`,
  'cancelGame': `!cancelGame [gameID]`,
  'endGame': `!endGame [gameID] [win (победа Импосторов) или lose (поражение)] [@impostor1] [@impostor2]`,
  'help': `!help`,
};

export const mainOwnerID = '278796523817402369';
