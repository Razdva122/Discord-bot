import { TGameType, TGameMaps } from '../types';

import { IShortUser } from './shortUser';

export interface IGame {
  id: number,
  state: 'started' | 'canceled' | 'deleted' | 'finished',
  map: TGameMaps,
  type: TGameType,
  started_by: IShortUser,
}

