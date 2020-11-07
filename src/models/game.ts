import { TGameType, TGameMaps, TSubtypeGameState } from '../types';

import { IShortUser } from './shortUser';

export interface IGame {
  id: number,
  state: 'started' | 'canceled' | 'deleted' | 'finished',
  subtype: TSubtypeGameState,
  map: TGameMaps,
  type: TGameType,
  started_by: IShortUser,
}

