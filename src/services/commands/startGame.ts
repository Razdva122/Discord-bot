import { ServerCommand } from './command';

import { Res, Err } from "../../utils/response";

import { helpText } from '../../consts';

import { TAnswer } from "../../types";

// !startGame roomName
export default class StartGame extends ServerCommand {
  validateCommand(args: string[]) {
    const [roomName] = args;
    if (!roomName) {
      return Err('Нужно передать название канала в котором стартует игра');
    }
    return Res('Команда корректна');
  }

  async executeCommand(): Promise<TAnswer> {
    const msg = Object.entries(helpText).reduce((acc, [command, description]) => {
      return `${acc}\n!${command} ${description}`;
    }, `\n!Команда {Уровень доступа} Описание\n-----------------------`) + `\n\nИспользуйте приписку help после любой команды, чтобы уточнить параметры.`;
    return Res(msg);
  }
}
