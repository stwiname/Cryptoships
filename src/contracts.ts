import { utils } from 'ethers';

export type LeadingBid = {
  bidder: string;
  amount: utils.BigNumber;
  move: number[];
};
