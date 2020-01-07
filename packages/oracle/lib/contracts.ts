export enum Team {
  red,
  blue,
}

export enum AuctionResult {
  unset,
  miss,
  hit,
}

export enum GameResult {
  unset,
  redWinner,
  blueWinner,
  aborted
}

export type BattleField<T = boolean> = T[][];
