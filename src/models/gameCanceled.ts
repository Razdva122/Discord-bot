import mongoose, { Document } from 'mongoose';

import shortUserSchema, { IShortUser } from './shortUser';

import gameSubTypesSchema from './gameSubTypes';

import { IGame } from './game';

export interface IGameCanceled extends IGame {
  state: 'canceled',
  players: IShortUser[],
  canceled_by: IShortUser,
}

type TGameCanceledModel = Document & IGameCanceled;

const gameCanceledSchema = new mongoose.Schema({
  id: Number,
  state: String,
  type: String,
  map: String,
  subtype: gameSubTypesSchema,
  players: [shortUserSchema],
  started_by: shortUserSchema,
  canceled_by: shortUserSchema,
});

export const GameCanceledModel = mongoose.model<TGameCanceledModel>('GameCanceled', gameCanceledSchema);
