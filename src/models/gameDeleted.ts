import mongoose, { Document } from 'mongoose';

import shortUserSchema, { IShortUser } from './shortUser';

export interface IGameDeleted {
  id: number,
  state: 'deleted',
  win: 'impostors' | 'crewmates',
  impostors: IShortUser[],
  crewmates: IShortUser[],
  result: {
    impostors: {
      name: IShortUser['name'],
      before: number,
      diff: number,
    }[],
    crewmates: {
      name: IShortUser['name'],
      before: number,
      diff: number,
    }[],
  },
  started_by: IShortUser,
  finished_by: IShortUser,
  deleted_by: IShortUser,
}

type TGameDeletedModel = Document & IGameDeleted;

const gameDeletedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  impostors: [shortUserSchema],
  crewmates: [shortUserSchema],
  result: {
    impostors: [{
      name: String,
      before: Number,
      diff: Number,
    }],
    crewmates: [{
      name: String,
      before: Number,
      diff: Number,
    }],
  },
  started_by: shortUserSchema,
  finished_by: shortUserSchema,
  deleted_by: shortUserSchema,
});

export const GameDeletedModel = mongoose.model<TGameDeletedModel>('GameDeleted', gameDeletedSchema);
