
import mongoose, { Document } from 'mongoose';

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  gamesID: [Number],
  history: [{
    reason: String,
    gameID: Number,
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
  history: IChangeRating[]
  rating: number,
}

interface IChangeRating {
  reason: 'win' | 'lose' | 'revert'
  gameID: number,
  rating: {
    before: number,
    after: number,
    diff: number,
  }
}

export const UserModel = mongoose.model<IUser>('User', userSchema);
