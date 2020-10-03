
import mongoose, { Document } from 'mongoose';
import shortUserSchema, { IShortUser } from './shortUser';
import { IGame } from './game';
import { TGameMaps } from '../types';

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  gamesID: [Number],
  history: [{
    reason: String,
    gameID: Number,
    map: String,
    team: String,
    changedBy: shortUserSchema,
    rating: {
      before: Number,
      after: Number,
      diff: Number,
    }
  }],
  rating: Number,
});


interface IUser extends Document {
  id: string,
  name: string,
  gamesID: number[],
  history: (IGameChangeRating | IManualyChangeRating)[]
  rating: number,
}

interface IChangeRating {
  reason: 'win' | 'lose' | 'revert' | 'manualy',
  rating: {
    before: number,
    after: number,
    diff: number,
  },
}

export interface IGameChangeRating extends IChangeRating {
  reason: 'win' | 'lose' | 'revert',
  map: TGameMaps,
  team: 'crewmates' | 'impostors',
  gameID: number,
}

interface IManualyChangeRating extends IChangeRating {
  reason: 'manualy',
  changedBy: IShortUser,
}

export const UserModel = mongoose.model<IUser>('User', userSchema);
