import InitServer from './initServer';
import UpdateRole from './updateRole';
import Help from './help';
import StartGame from './startGame';

import { accessLevelToMethods, commandHelp } from '../../consts';

export default {
  '!initServer': new InitServer(accessLevelToMethods.initServer, commandHelp.initServer),
  '!updateRole': new UpdateRole(accessLevelToMethods.updateRole, commandHelp.updateRole),
  '!help': new Help(accessLevelToMethods.help, commandHelp.help),
  '!startGame': new StartGame(accessLevelToMethods.startGame, commandHelp.startGame),
}