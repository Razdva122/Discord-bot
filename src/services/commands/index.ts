import InitServer from './initServer';
import UpdateRole from './updateRole';
import DeleteGame from './deleteGame';
import Help from './help';
import StartGame from './startGame';
import CancelGame from './cancelGame';
import EndGame from './endGame';
import InitLeaderboard from './initLeaderboard';
import GameHistory from './gameHistory';

import { accessLevelToMethods, commandHelp } from '../../consts';

export default {
  '!initServer': new InitServer(accessLevelToMethods.initServer, commandHelp.initServer),
  '!updateRole': new UpdateRole(accessLevelToMethods.updateRole, commandHelp.updateRole),
  '!deleteGame': new DeleteGame(accessLevelToMethods.deleteGame, commandHelp.deleteGame),
  '!help': new Help(accessLevelToMethods.help, commandHelp.help),
  '!startGame': new StartGame(accessLevelToMethods.startGame, commandHelp.startGame),
  '!cancelGame': new CancelGame(accessLevelToMethods.cancelGame, commandHelp.cancelGame),
  '!endGame': new EndGame(accessLevelToMethods.endGame, commandHelp.endGame),
  '!initLeaderboard': new InitLeaderboard(accessLevelToMethods.initLeaderboard, commandHelp.initLeaderboard),
  '!gameHistory': new GameHistory(accessLevelToMethods.gameHistory, commandHelp.gameHistory),
}