import { utils } from 'ethers';

export type LeadingBid = {
  bidder: string;
  amount: utils.BigNumber;
  move: number[];
};

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

export const MEDIA_QUERY_COND = '(min-width:1200px)';

export type FieldStates = AuctionResult | "aiming" | "unplayed";