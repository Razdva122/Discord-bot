import { TAccessLevel, ValuesOf, TAPIMethods } from '../types';

export const defaultRating = 2000;

export const usersInLeaderboard = 50;

export const maxNicknameForLeadeboardLength = 18;

export const additionalRoles = {
  legacy: 'Legacy',
  donate: 'Server Booster',
};

export const ratingChange = {
  crewmate: {
    win: 15,
    lose: -30,
  },
  impostor: {
    win: 120,
    lose: -60,
  },
};

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
  'initStats': accessLevel.admins,
  'initLeaderboard': accessLevel.admins,
  'initGameState': accessLevel.admins,
  'changeRating': accessLevel.admins,
  'startGame': accessLevel.verified,
  'cancelGame': accessLevel.verified,
  'endGame': accessLevel.verified,
  'resetStats': accessLevel.all,
  'gameHistory': accessLevel.all,
  'stats': accessLevel.all,
  'help': accessLevel.all,
}

export const methods = Object.keys(accessLevelToMethods);

export const helpText: { readonly [key in TAPIMethods]: string } = {
  'initServer': `{${helpLevel[accessLevelToMethods.initServer]}} Инициализировать бота`,
  'updateRole': `{${helpLevel[accessLevelToMethods.updateRole]}} Обновить роль`,
  'deleteGame': `{${helpLevel[accessLevelToMethods.deleteGame]}} Удалить игру`,
  'initLeaderboard': `{${helpLevel[accessLevelToMethods.initLeaderboard]}} Создать лидерборд`,
  'initStats': `{${helpLevel[accessLevelToMethods.initStats]}} Создать статистику`,
  'initGameState': `{${helpLevel[accessLevelToMethods.initGameState]}} Создать статистику шансов на игры`,
  'changeRating': `{${helpLevel[accessLevelToMethods.changeRating]}} Изменить рейтинг`,
  'startGame': `{${helpLevel[accessLevelToMethods.startGame]}} Начать игру`,
  'cancelGame': `{${helpLevel[accessLevelToMethods.cancelGame]}} Отменить игру`,
  'endGame': `{${helpLevel[accessLevelToMethods.endGame]}} Закончить игру`,
  'resetStats': `{${helpLevel[accessLevelToMethods.resetStats]}} Обнулить статистику`,
  'gameHistory': `{${helpLevel[accessLevelToMethods.gameHistory]}} Получить информацию по игре`,
  'stats': `{${helpLevel[accessLevelToMethods.stats]}} Получить вашу статистику`,
  'help': `{${helpLevel[accessLevelToMethods.help]}} Помощь`,
}

export const commandHelp: { readonly [key in TAPIMethods]: string } = {
  'initServer': `\n!initServer [Роль админов] [Роль верифицированных пользователей]\n!initServer Admin Verified`,
  'updateRole': `\n!updateRole [admins или verified] [Новая роль]\n!updateRole admins new_admins`,
  'deleteGame': `\n!deleteGame [gameID]\n!deleteGame 138`,
  'initLeaderboard': '\n!initLeaderboard',
  'initStats': '\n!initStats',
  'initGameState': '\n!initGameState',
  'changeRating': '\n!changeRating [Изменение рейтинга] [@user]\n!changeRating -20 @someone',
  'startGame': `\n!startGame [Название голосовой комнаты] [Название карты skeld или polus]\n!startGame Спутник skeld`,
  'cancelGame': `\n!cancelGame [gameID]\n!cancelGame 138`,
  'endGame': `\n!endGame [gameID] [win (победа Импосторов) или lose (поражение)] [@impostor1] [@impostor2]\n!endGame win 138 @someone @someonelse`,
  'resetStats': '\n!resetStats',
  'stats': '\n!stats [Количество операций] [show - отобразить статистику в чате]\n!stats 30 show',
  'gameHistory': '\n!gameHistory [gameID]\n!gameHistory 138',
  'help': `\n!help`,
};

export const amountOfResets = {
  default: 2,
  legacy: 1,
  donate: 1,
}

// Укажите Ваш ID для работы с ботом
export const mainOwnerID = '278796523817402369';
