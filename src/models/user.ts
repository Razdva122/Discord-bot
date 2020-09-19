
import mongoose, { Document } from 'mongoose';

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  gamesID: [String],
  history: [{
    reason: String,
    gameID: String,
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
  gamesID: string[],
  history: IChangeRating[]
  rating: number,
}

interface IChangeRating {
  reason: 'win' | 'lose' | 'revert'
  gameID: string,
  rating: {
    before: number,
    after: number,
    diff: number,
  }
}


export const UserModel = mongoose.model<IUser>('User', userSchema);
