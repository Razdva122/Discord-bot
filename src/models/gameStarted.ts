import mongoose, { Document } from 'mongoose';

import shortUserSchema, { IShortUser } from './shortUser';

import { IGame } from './game';

export interface IGameStarted extends IGame {
  state: 'started',
  players: IShortUser[],
}

type TGameStartedModel = Document & IGameStarted;

const gameStartedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  type: String,
  map: String,
  players: [shortUserSchema],
  started_by: shortUserSchema,
});

export const GameStartedModel = mongoose.model<TGameStartedModel>('GameStarted', gameStartedSchema);
