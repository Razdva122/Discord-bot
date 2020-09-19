import { User, Message } from 'discord.js';

export * from './util';

export type TAccessLevel = 'owner' | 'admins' | 'verified' | 'all';

export type TMethodsWithoutServer = 'initServer' | 'deleteServer';
export type TMethodsWithServer = 'startGame' | 'cancelGame' | 'endGame' | 'deleteGame' | 
  'updateRole' | 'help';
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

export interface IServersFromMongo {
  serverID: string,
  adminsRoleID: string,
  verifiedRoleID: string,
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

