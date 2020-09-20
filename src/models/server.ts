import mongoose, { Document } from 'mongoose';

const serverSchema = new mongoose.Schema({
  name: String,
  id: String,
  adminsID: String,
  verifiedID: String,
});

interface IServerSchema extends Document {
  name: string,
  id: string,
  adminsID: string,
  verifiedID: string,
}

export const ServerModel = mongoose.model<IServerSchema>('Server', serverSchema);