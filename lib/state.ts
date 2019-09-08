import {generateBattlefield, generateEmptyField } from './generator';
import { BattleField, Team, AuctionResult } from './contracts';

export default class State {

  private battleFields: Record<Team, BattleField>;
  private movesMade: Record<Team, BattleField<AuctionResult>>;

  constructor(battleFields?: Record<Team, BattleField>, ships?: number[]) {

    this.battleFields = battleFields || {
      [Team.red]: generateBattlefield(),
      [Team.blue]: generateBattlefield()
    };

    const size = this.getSize()

    this.movesMade = {
      [Team.red]: generateEmptyField(size, AuctionResult.unset),
      [Team.blue]: generateEmptyField(size, AuctionResult.unset),
    };
  }

  public setMovesMade(team: Team, auctionResults: { move: number[] , result: AuctionResult }[]) {
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

  private getSize() {
    return this.battleFields[Team.red].length;
  }
}