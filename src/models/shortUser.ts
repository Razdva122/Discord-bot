import mongoose from 'mongoose';

export interface IShortUser {
  id: string,
  name: string,
}

const shortUserSchema = new mongoose.Schema({
  id: String,
  name: String,
});

export default shortUserSchema;
