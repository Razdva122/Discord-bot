import { ServerCommand } from './command';

import { Res } from "../../utils/response";

import { helpText } from '../../consts';

import { TAnswer } from "../../types";

// !help
export default class Help extends ServerCommand {
  validateCommand() {
    return Res('Команда корректна');
  }

  async executeCommand(): Promise<TAnswer> {
    const msg = Object.entries(helpText).reduce((acc, [command, description]) => {
      return `${acc}\n!${command} ${description}`;
    }, `\n!Команда {Уровень доступа} Описание\n-----------------------`) + `\n\nИспользуйте приписку help после любой команды, чтобы уточнить параметры.`;
    return Res(msg);
  }
}
