import InitServer from './initServer';
import UpdateRoles from './updateRoles';

import { accessLevelToMethods, helpText } from '../../consts';

export default {
  '!initServer': new InitServer(accessLevelToMethods.initServer, helpText.initServer),
  '!updateRoles': new UpdateRoles(accessLevelToMethods.updateRoles, helpText.updateRoles),
}