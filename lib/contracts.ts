export enum Team {
  red,
  blue,
}

export enum AuctionResult {
  unset,
  miss,
  hit,
}

export type BattleField<T = boolean> = T[][];
