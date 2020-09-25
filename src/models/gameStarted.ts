import mongoose, { Document } from 'mongoose';

import shortUserSchema, { IShortUser } from './shortUser';

export interface IGameStarted {
  id: number,
  state: 'started',
  players: IShortUser[],
  started_by: IShortUser,
}

type TGameStartedModel = Document & IGameStarted;

const gameStartedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  players: [shortUserSchema],
  started_by: shortUserSchema,
});

export const GameStartedModel = mongoose.model<TGameStartedModel>('GameStarted', gameStartedSchema);
