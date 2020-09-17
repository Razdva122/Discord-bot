type TUsers = {
  [key: string]: IUser
}

type TGames = {
  [key: string]: IGame
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

interface IUser {
  id: string,
  name: string,
  gamesID: string[],
  history: IChangeRating[]
  rating: number,
}

interface IUserInGame {
  id: IUser['id'],
  name: IUser['name'],
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

interface IServer {
  id: string,
  users: TUsers,
  games: TGames,
}