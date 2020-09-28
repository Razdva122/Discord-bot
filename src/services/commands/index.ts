import InitServer from './initServer';
import UpdateRole from './updateRole';
import DeleteGame from './deleteGame';
import Help from './help';
import StartGame from './startGame';
import CancelGame from './cancelGame';
import EndGame from './endGame';
import InitLeaderboard from './initLeaderboard';
import InitStats from './initStats';
import GameHistory from './gameHistory';

import { accessLevelToMethods, commandHelp } from '../../consts';

export default {
  '!initserver': new InitServer(accessLevelToMethods.initServer, commandHelp.initServer),
  '!updaterole': new UpdateRole(accessLevelToMethods.updateRole, commandHelp.updateRole),
  '!deletegame': new DeleteGame(accessLevelToMethods.deleteGame, commandHelp.deleteGame),
  '!help': new Help(accessLevelToMethods.help, commandHelp.help),
  '!startgame': new StartGame(accessLevelToMethods.startGame, commandHelp.startGame),
  '!cancelgame': new CancelGame(accessLevelToMethods.cancelGame, commandHelp.cancelGame),
  '!endgame': new EndGame(accessLevelToMethods.endGame, commandHelp.endGame),
  '!initleaderboard': new InitLeaderboard(accessLevelToMethods.initLeaderboard, commandHelp.initLeaderboard),
  '!initstats': new InitStats(accessLevelToMethods.initStats, commandHelp.initStats),
  '!gamehistory': new GameHistory(accessLevelToMethods.gameHistory, commandHelp.gameHistory),
}