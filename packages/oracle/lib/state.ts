import { AuctionResult, BattleField, Team } from './contracts';
import { generateBattlefield, generateEmptyField, computeFieldHash } from './generator';

export default class State {
  /* TODO look at storing just the ship locations as an easier way to check if all ships hit */
  public battleFields: Readonly<Record<Team, BattleField>>;
  private movesMade: Record<Team, BattleField<AuctionResult>>;

  public static generate(size?: number): State {
    return new State(
      {
        [Team.red]: generateBattlefield(size),
        [Team.blue]: generateBattlefield(size),
      }
    );
  }

  constructor(battleFields: Record<Team, BattleField>, ships?: number[]) {
    this.battleFields = Object.freeze(battleFields);

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

    this.movesMade[team] = field;
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

  public getFieldHashForTeam(team: Team): string {
    return computeFieldHash(this.battleFields[team]);
  }

  private getSize() {
    return this.battleFields[Team.red].length;
  }
}
