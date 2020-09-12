import { TAccessLevel, ValuesOf, TAPIMethods } from './types';

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
  'deleteServer': accessLevel.owner,
  'startGame': accessLevel.verified,
  'cancelGame': accessLevel.verified,
  'endGame': accessLevel.verified,
  'deleteGame': accessLevel.admins,
  'updateRoles': accessLevel.admins,
  'help': accessLevel.all,
}

export const helpText: { readonly [key in TAPIMethods]: string } = {
  'initServer': `[${helpLevel[accessLevelToMethods.initServer]}] Инициализировать бота`,
  'deleteServer': `[${helpLevel[accessLevelToMethods.deleteServer]}] Выключить бота`,
  'startGame': `[${helpLevel[accessLevelToMethods.startGame]}] Начать игру`,
  'cancelGame': `[${helpLevel[accessLevelToMethods.cancelGame]}] Отменить игру`,
  'endGame': `[${helpLevel[accessLevelToMethods.endGame]}] Закончить игру`,
  'deleteGame': `[${helpLevel[accessLevelToMethods.deleteGame]}] Удалить игру`,
  'updateRoles': `[${helpLevel[accessLevelToMethods.updateRoles]}] Обновить роли`,
  'help': `[${helpLevel[accessLevelToMethods.help]}] Помощь`,
}

export const mainOwnerID = '278796523817402369';
