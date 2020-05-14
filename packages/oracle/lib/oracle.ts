import { Signer, utils, ContractTransaction } from 'ethers';
import { Provider } from 'ethers/providers';
import moment from 'moment';
import { range } from 'ramda';
import Web3 from 'web3';
import winston, { format } from 'winston';
import { AuctionResult, Team, GameResult } from './contracts';
import { battleFieldToBuffer } from './generator';
import State from './state';

const { abi: gameAbi } = require('contracts/build/contracts/Game.json');
const { abi: auctionAbi } = require('contracts/build/contracts/Auction.json');

import { Game } from 'contracts/types/ethers-contracts/Game';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';

type Unwrap<T> =
  T extends Promise<infer U> ? U :
  T extends (...args: any) => Promise<infer U> ? U :
  T extends (...args: any) => infer U ? U :
  T;

type Auction = Unwrap<ReturnType<Game["getAuctionByIndex"]>>;

type AuctionExt = Auction & { index: number, hasEnded?: boolean };

function truncateAddress(address: string) {
  return `${address.substr(0, 4)}...${address.substr(address.length -4)}`;
}

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.label(),
        // format.json(),
        format.colorize(),
        format.simple(),
        format.printf(
          info => `[${info.timestamp}][${info.level}]${info.message}`
        )
      ),
    }),
  ],
});

export default class Oracle {
  public static create(
    signerOrProvider: Signer | Provider,
    contractAddress: string,
    state: State
  ) {
    return new Oracle(
      GameFactory.connect(contractAddress, signerOrProvider),
      state
    );
  }

  private timeouts: Partial<Record<Team, NodeJS.Timeout>> = {};

  constructor(private instance: Game, private state: State) {
    logger.info(`Running oracle for game at ${instance.address}`);

    this.setup()
      .then(() => logger.info('Setup success'))
      .catch(e => logger.error('Setup failed', e));

    instance.on(
      'HighestBidPlaced',
      (
        team: Team,
        bidder: string,
        amount: utils.BigNumber,
        move: [number, number],
        endTime: utils.BigNumber,
        auctionIndex: number,
      ) => {
        logger.info('HigestBidPlaced');

        this.handleBidPlaced(team, auctionIndex, endTime.toNumber() * 1000);
      }
    );
  }

  private async setup() {
    const result = await this.instance.functions.getResult();

    if (result !== GameResult.unset) {
      logger.info('Game already completed');
      process.exit(0);
    }

    await this.setupForTeam(Team.red);
    await this.setupForTeam(Team.blue);
  }

  private async setupForTeam(team: Team) {
    const auctionsCount = await this.instance.functions.getAuctionsCount(team);

    logger.info(`${Team[team]} has ${auctionsCount} auctions`);

    const auctions = (await Promise.all<AuctionExt>(range(0, auctionsCount).map(async idx => {
      return {
        ...await this.getAuctionByIndex(team, idx),
        hasEnded: await this.instance.hasAuctionEnded(team, idx),
        index: idx
      };
    })))
      .filter(a => !a.leadingBid.amount.isZero()); // Filter out any unplayed auctions

    // Check if any auctions need to be confirmed
    await Promise.all(auctions.map(async a => {
      if (a.hasEnded && a.result === AuctionResult.unset) {
        await this.confirmMove(a, team);
      }
    }));

    // this.state.setMovesMade(team, auctionResults);
    this.state.setMovesMade(team, auctions.map(a => ({ result: a.result, move: a.leadingBid.move })));

    if (this.state.checkAllShipsHit(team)) {
      await this.finalizeGame(team);
      process.exit(0);
    } else {
      logger.info(`Not all ships hit for team ${Team[team]}, continuing game`);
    }

    const index = await this.instance.getCurrentAuctionIndex(team)
      .catch(e => null);  // Swallow error, auction wont exist yet

    if (index == null) {
      return;
    }
    const currentAuction: AuctionExt = await this.getAuctionByIndex(team, index);

    if (!(await this.instance.hasAuctionEnded(team, index))) {
      logger.debug('END TIME', currentAuction.endTime.toString(), currentAuction.endTime.toNumber());
      if (currentAuction.endTime.isZero()) {
        // Auction not yet started
        logger.info(
          `Running auction (${index}) for team ${Team[team]} has not yet got an end time`,
          await this.instance.hasAuctionEnded(team, index)
        );
        return;
      }
      await this.createPendingConfirmation(
        team,
        currentAuction,
        currentAuction.endTime.toNumber() * 1000
      );
    }
  }

  private async handleBidPlaced(team: Team, auctionIndex: number, endTime: number) {
    this.createPendingConfirmation(
      team,
      await this.getAuctionByIndex(team, auctionIndex),
      endTime
    );
  }

  private createPendingConfirmation(
    team: Team,
    auction: AuctionExt,
    endTime: number
  ) {
    // We already have a timeout for this
    // TODO do we need to check its for the same auction?
    if (this.timeouts[team]) {
      return;
    }

    logger.info(`Creating pending confirmation for ${Team[team]} team`);
    this.timeouts[team] = setTimeout(() => {
      logger.info(
        `Confirming move for ${
          Team[team]
        } team, now: ${Date.now()}, endTime: ${endTime}`
      );
      this.confirmMove(auction, team);

      delete this.timeouts[team];
    }, endTime - Date.now() + 2000);
  }

  private async confirmMove(auction: AuctionExt, team: Team, retries = 1): Promise<ContractTransaction> {
    const hasEnded = auction.hasEnded ?? await this.instance.hasAuctionEnded(team, auction.index);
    logger.info(`Confirming move for ${auction.index}, has finished ${hasEnded}`);
    // For some reason this is thinking it hasn't ended

    if (!hasEnded) {
      logger.warn('Auction has not yet ended, attempting to confirm move');
    //   const endTime = await auction.functions.getEndTime();
    //   logger.debug('END TIME', endTime.toNumber(), Date.now()/1000);
    //   logger.debug(`Auction has not yet ended for ${Team[team]} team, cannot confirm`);
    //   // TODO need to limit recursion
    //   // this.createPendingConfirmation(team, auction, endTime.toNumber() * 1000);
    //   return;
    }

    // Check if hit or miss
    const hit = this.state.setMoveMade(team, auction.leadingBid.move[0], auction.leadingBid.move[1]);

    if (this.state.checkAllShipsHit(team)) {
      await this.finalizeGame(team);

      logger.info(`Game won by ${Team[team]}`);
      process.exit(0);
    } else {
      logger.info(`Not all ships hit by ${Team[team]}`);
    }

    const retry = async (e: Error) => {
      // TODO try to filter by e.message === 'Failed to confirm move', needs testing on mainnet
      if (retries > 0) {
        logger.warn("Transaction failed, retrying", e);
        // Wait 10% of auction time to try again
        const time =
          auction.duration.toNumber() *
          100; /* 1000 / 10 */
        await new Promise(resolve => {
          setTimeout(resolve, time);
        });

        return this.confirmMove(auction, team, retries - 1);
      }
      logger.error('Failed to confirm move', e.message, e);
      throw e;
    }

    // Set move on game and possibly start next auction
    // Have to manually specify gas because it's not always estimated properly, this is due to contracts calling contracts
    const tx: ContractTransaction = await this.instance.functions.confirmMove(team, hit, auction.index, { gasLimit: 2000000 })
      .catch(retry);

    logger.info(`[${tx.hash}] Confirm move tx submitted`);


    this.logTxResult(tx);

    tx.wait(1)
      .catch((e) => retry(e));

    return tx;
  }

  private async getAuctionByIndex(team: Team, index: number): Promise<AuctionExt> {
    return { ...await this.instance.getAuctionByIndex(team, index), index };
  }

  private async getCurrentAuctionForTeam(team: Team): Promise<Auction> {
    return this.instance.functions.getCurrentAuction(team);
  }

  private async finalizeGame(team: Team) {
    logger.info('Finalizing game');

    const tx = await this.instance.functions.finalize(
      team,
      battleFieldToBuffer(this.state.battleFields[team]),
      utils.formatBytes32String('') // TODO get actual salt
    );

    logger.info(`[${tx.hash}] Finalize game submitted`);

    this.logTxResult(tx);

    await tx.wait(1);
  }

  private otherTeam(team: Team): Team {
    return Team[team] === Team[Team.red] ? Team.blue : Team.red;
  }

  private logTxResult(tx: ContractTransaction) {
    tx.wait(1)
      .then(() => {
        logger.info(`[${tx.hash}] confirmed`);
      })
      .catch(e => {
        logger.warn(`[${tx.hash}] failed ${JSON.stringify(e)}`);
      });
  }
}
