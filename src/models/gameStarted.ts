import mongoose, { Document } from 'mongoose';

import userInGameSchema, { IUserInGame } from './userInGame';

interface IGameStarted extends Document {
  id: number,
  state: 'started',
  players: IUserInGame[],
}

const gameStartedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  players: [userInGameSchema],
});

export const GameStartedModel = mongoose.model<IGameStarted>('GameStarted', gameStartedSchema);
