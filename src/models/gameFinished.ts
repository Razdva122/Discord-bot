import mongoose, { Document } from 'mongoose';

import userInGameSchema, { IUserInGame } from './userInGame';

interface IGameFinished extends Document {
  id: number,
  state: 'finished',
  win: 'impostors' | 'crewmate',
  impostors: IUserInGame[],
  crewmate: IUserInGame[],
  result: {
    name: IUserInGame['name'],
    before: number,
    diff: number,
  }[],
}

const gameStartedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  impostors: [userInGameSchema],
  crewmate: [userInGameSchema],
  result: [{
    name: String,
    before: Number,
    diff: Number,
  }],
});

export const GameFinishedModel = mongoose.model<IGameFinished>('GameFinished', gameStartedSchema);