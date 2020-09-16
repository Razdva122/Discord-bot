import { TAnswerError, TAnswerResult} from '../types';

export function Err(msg: string): TAnswerError {
  return {
    error: {
      msg,
    }
  }
}

export function Res<T>(data: T): TAnswerResult<T> {
  return {
    result: {
      data,
    }
  }
}