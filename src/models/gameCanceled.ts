import mongoose, { Document } from 'mongoose';

import userInGameSchema, { IUserInGame } from './userInGame';

interface IGameCanceled extends Document {
  id: number,
  state: 'canceled',
  players: IUserInGame[],
}

const gameCanceledSchema = new mongoose.Schema({
  id: Number,
  state: String,
  players: [userInGameSchema],
});

export const GameCanceledModel = mongoose.model<IGameCanceled>('GameCanceled', gameCanceledSchema);
