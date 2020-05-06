import { utils } from 'ethers';
import { Game } from 'contracts/types/ethers-contracts/Game';

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

export const MEDIA_QUERY_COND = '(min-width:1000px)';

export type FieldStates = AuctionResult | "aiming" | "unplayed";

type Unwrap<T> =
  T extends Promise<infer U> ? U :
  T extends (...args: any) => Promise<infer U> ? U :
  T extends (...args: any) => infer U ? U :
  T;

export type Auction = Unwrap<ReturnType<Game["getAuctionByIndex"]>>;

export type AuctionExt = Auction & { index: number, hasEnded?: boolean };