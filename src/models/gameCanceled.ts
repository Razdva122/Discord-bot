import mongoose, { Document } from 'mongoose';

import shortUserSchema, { IShortUser } from './shortUser';

export interface IGameCanceled {
  id: number,
  state: 'canceled',
  players: IShortUser[],
  started_by: IShortUser,
  canceled_by: IShortUser,
}

type TGameCanceledModel = Document & IGameCanceled;

const gameCanceledSchema = new mongoose.Schema({
  id: Number,
  state: String,
  players: [shortUserSchema],
  started_by: shortUserSchema,
  canceled_by: shortUserSchema,
});

export const GameCanceledModel = mongoose.model<TGameCanceledModel>('GameCanceled', gameCanceledSchema);
