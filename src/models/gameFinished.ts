import mongoose, { Document } from 'mongoose';

import userInGameSchema, { IUserInGame } from './userInGame';

export interface IGameFinished {
  id: number,
  state: 'finished',
  win: 'impostors' | 'crewmates',
  impostors: IUserInGame[],
  crewmates: IUserInGame[],
  result: {
    name: IUserInGame['name'],
    before: number,
    diff: number,
  }[],
}

type TGameFinishedModel = Document & IGameFinished;

const gameStartedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  impostors: [userInGameSchema],
  crewmates: [userInGameSchema],
  result: [{
    name: String,
    before: Number,
    diff: Number,
  }],
});

export const GameFinishedModel = mongoose.model<TGameFinishedModel>('GameFinished', gameStartedSchema);
