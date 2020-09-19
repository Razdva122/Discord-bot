import InitServer from './initServer';
import UpdateRole from './updateRole';
import Help from './help';

import { accessLevelToMethods, helpText } from '../../consts';

export default {
  '!initServer': new InitServer(accessLevelToMethods.initServer, helpText.initServer),
  '!updateRole': new UpdateRole(accessLevelToMethods.updateRole, helpText.updateRole),
  '!help': new Help(accessLevelToMethods.help, helpText.help),
}