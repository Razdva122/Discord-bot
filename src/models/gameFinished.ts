import mongoose, { Document } from 'mongoose';

import shortUserSchema, { IShortUser } from './shortUser';

import { IGame } from './game';

export interface IGameFinished extends IGame {
  state: 'finished',
  win: 'impostors' | 'crewmates',
  impostors: IShortUser[],
  crewmates: IShortUser[],
  result: {
    impostors: {
      name: IShortUser['name'],
      before: number,
      diff: number,
      id: IShortUser['id'],
    }[],
    crewmates: {
      name: IShortUser['name'],
      before: number,
      diff: number,
      id: IShortUser['id'],
    }[],
  },
  finished_by: IShortUser,
}

type TGameFinishedModel = Document & IGameFinished;

const gameFinishedSchema = new mongoose.Schema({
  id: Number,
  state: String,
  win: String,
  type: String,
  impostors: [shortUserSchema],
  crewmates: [shortUserSchema],
  result: {
    impostors: [{
      name: String,
      before: Number,
      diff: Number,
      id: String,
    }],
    crewmates: [{
      name: String,
      before: Number,
      diff: Number,
      id: String,
    }],
  },
  started_by: shortUserSchema,
  finished_by: shortUserSchema,
});

export const GameFinishedModel = mongoose.model<TGameFinishedModel>('GameFinished', gameFinishedSchema);
