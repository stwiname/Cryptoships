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

export type BattleField<T = boolean> = T[][];
