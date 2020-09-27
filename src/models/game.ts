import { TGameType } from '../types';

import { IShortUser } from './shortUser';

export interface IGame {
  id: number,
  state: 'started' | 'canceled' | 'deleted' | 'finished',
  type: TGameType,
  started_by: IShortUser,
}

