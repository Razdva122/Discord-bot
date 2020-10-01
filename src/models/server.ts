import mongoose, { Document } from 'mongoose';

const serverSchema = new mongoose.Schema({
  name: String,
  id: String,
  lastGameID: Number,
  adminsID: String,
  verifiedID: String,
  stats: {
    skeld: {
      mini: {
        amount: Number,
        imposters_win: Number,
        crewmates_win: Number,
      },
      full: {
        amount: Number,
        imposters_win: Number,
        crewmates_win: Number,
      },
    },
  },
});

export interface IModeStats {
  amount: number,
  imposters_win: number,
  crewmates_win: number,
};

export interface IServerStats {
  skeld: {
    mini: IModeStats,
    full: IModeStats,
  }
}

interface IServerSchema extends Document {
  name: string,
  id: string,
  lastGameID: number,
  adminsID: string,
  verifiedID: string,
  stats: IServerStats,
}

export const ServerModel = mongoose.model<IServerSchema>('Server', serverSchema);
