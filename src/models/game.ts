import mongoose, { Document } from 'mongoose';

interface IUserInGame {
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

const gameSchema = new mongoose.Schema({
  id: Number,
  state: String,
  verifiedID: String,
});

const Game = mongoose.model<TGame>('Game', gameSchema);

export default Game;
