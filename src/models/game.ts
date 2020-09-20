import mongoose, { Document } from 'mongoose';

export interface IUserInGame {
  id: string,
  name: string,
}

interface IGame {
  id: number,
  state: 'progress' | 'finished' | 'canceled',
}

interface IGameInProgress extends IGame {
  state: 'progress',
  players: IUserInGame[],
}

interface IGameFinished extends IGame {
  state: 'finished',
  win: 'impostors' | 'crewmate',
  impostors: IUserInGame[],
  crewmate: IUserInGame[],
  result: {
    name: IUserInGame['name'],
    before: number,
    diff: number,
  }[],
}

interface IGameCanceled extends IGame {
  state: 'canceled',
  impostors: IUserInGame[],
  crewmate: IUserInGame[],
}

type TGame = (IGameInProgress | IGameFinished | IGameCanceled) & Document;

const userInGameSchema = new mongoose.Schema({
  id: String,
  name: String,
});

const gameSchema = new mongoose.Schema({
  id: Number,
  state: String,
  win: String,
  players: [userInGameSchema],
  impostors: [userInGameSchema],
  crewmate: [userInGameSchema],
  result: [{
    name: String,
    before: Number,
    diff: Number,
  }]
});

export const GameModel = mongoose.model<TGame>('Game', gameSchema);

