import mongoose, { Document } from 'mongoose';
import { TGameMaps, TSubtypesGameChance } from '../types';

const serverSchema = new mongoose.Schema({
  name: String,
  id: String,
  lastGameID: Number,
  adminsID: String,
  verifiedID: String,
  subtypesGameChance: {
    lucky: Number,
    double: Number,
  },
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
    polus: {
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

export type TServerStats = {
  [key in TGameMaps]: {
    mini: IModeStats,
    full: IModeStats,
  }
};

export type TServer = {
  name: string,
  id: string,
  lastGameID: number,
  adminsID: string,
  verifiedID: string,
  subtypesGameChance: TSubtypesGameChance,
  stats: TServerStats,
}

export const ServerModel = mongoose.model<TServer & Document>('Server', serverSchema);
