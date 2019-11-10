import { AuctionResult, BattleField, Team } from './contracts';
import { generateBattlefield, generateEmptyField } from './generator';

export default class State {
  /* TODO look at storing just the ship locations as an easier way to check if all ships hit */
  private battleFields: Record<Team, BattleField>;
  private movesMade: Record<Team, BattleField<AuctionResult>>;

  constructor(battleFields?: Record<Team, BattleField>, ships?: number[]) {
    this.battleFields = battleFields || {
      [Team.red]: generateBattlefield(),
      [Team.blue]: generateBattlefield(),
    };

    const size = this.getSize();

    this.movesMade = {
      [Team.red]: generateEmptyField(size, AuctionResult.unset),
      [Team.blue]: generateEmptyField(size, AuctionResult.unset),
    };
  }

  public setMovesMade(
    team: Team,
    auctionResults: Array<{ move: number[]; result: AuctionResult }>
  ) {
    const field = generateEmptyField(this.getSize(), AuctionResult.unset);

    auctionResults.map(result => {
      field[result.move[0]][result.move[1]] = result.result;
    });
  }

  public setMoveMade(team: Team, x: number, y: number): boolean {
    this.movesMade[team][x][y] = this.battleFields[team][x][y]
      ? AuctionResult.hit
      : AuctionResult.miss;
    return this.battleFields[team][x][y];
  }

  public checkAllShipsHit(team: Team): boolean {
    const battleField = this.battleFields[team];
    const movesMade = this.movesMade[team];

    for (let x = 0; x < battleField.length; x++) {
      for (let y = 0; y < battleField.length; y++) {
        if (
          battleField[x][y] === true &&
          movesMade[x][y] !== AuctionResult.hit
        ) {
          return false;
        }
      }
    }

    return true;
  }

  private getSize() {
    return this.battleFields[Team.red].length;
  }
}
