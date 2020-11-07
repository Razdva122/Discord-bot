import { User, Message } from 'discord.js';

import { IShortUser } from '../models/shortUser';

export * from './util';

export type TAccessLevel = 'owner' | 'admins' | 'verified' | 'all';

export type TGameType = 'mini' | 'full';

export type TGameMaps = 'skeld' | 'polus';

export type TMethodsWithoutServer = 'initServer';
export type TMethodsWithServer = 'startGame' | 'cancelGame' | 'endGame' | 'deleteGame' | 
  'updateRole' | 'help' | 'initLeaderboard' | 'gameHistory' | 'initStats' |
  'changeRating' | 'stats' | 'resetStats' | 'initGameState';

export type TGameSubTypesNames = 'lucky' | 'double';

export type TSubtypesGameChance = {
  [key in TGameSubTypesNames]: number;
};
export type TSubtypeGameState = {
  [key in TGameSubTypesNames]: boolean;
};
export type TAPIMethods = TMethodsWithoutServer | TMethodsWithServer;

export type Parameters<T> = T extends (... args: infer T) => any ? T : never; 

export type TAPIClassMethods = {
  [key in TAPIMethods]: (...args: any) => TAnswer<any>
}

export type TMessageParserMethods = {
  [key in TAPIMethods]: (msg: Message, ...args: string[]) => string
}

export interface ICommand {
  (args: string[], user: User, serverID: string): void,
  help: string,
  access: TAccessLevel,
}

export type TAnswerResult<T> = {
  result: {
    data: T,
  },
  error?: never,
};

export type TAnswerError = {
  result?: never,
  error: {
    msg: string,
  },
}

export type TAnswer<T = string> = TAnswerResult<T> | TAnswerError;

export type TGameResult = 'win' | 'lose';

export interface IGameFinishState {
  id: number,
  type: TGameType,
  map: TGameMaps,
  subtype: TSubtypeGameState,
  impostorsRes: TGameResult,
  impostors: IShortUser[],
  crewmates: IShortUser[],
  started_by: IShortUser,
  finished_by: IShortUser,
}
