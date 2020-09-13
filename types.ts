import { User } from 'discord.js';

export type TAccessLevel = 'owner' | 'admins' | 'verified' | 'all';

export type TMethodsWithoutServer = 'initServer' | 'deleteServer';
export type TMethodsWithServer = 'startGame' | 'cancelGame' | 'endGame' | 'deleteGame' | 
  'updateRoles' | 'help';
export type TAPIMethods = TMethodsWithoutServer | TMethodsWithServer;

export type Parameters<T> = T extends (... args: infer T) => any ? T : never; 

export type TAPIClassMethods = {
  [key in TAPIMethods]: (...args: any) => TAnswer<any>
}

export type TMessageParserMethods = {
  [key in TAPIMethods]: (...args: any) => string | null
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

export type ValuesOf<T> = T[keyof T];

export type Constructor<T> = Function & { prototype: T }

export type TAnswer<T> = TAnswerResult<T> | TAnswerError;