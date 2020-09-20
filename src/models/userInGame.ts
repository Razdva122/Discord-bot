import mongoose from 'mongoose';

export interface IUserInGame {
  id: string,
  name: string,
}

const userInGameSchema = new mongoose.Schema({
  id: String,
  name: String,
});

export default userInGameSchema;
