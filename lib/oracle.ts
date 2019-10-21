import { Signer, utils } from 'ethers';
import { Provider } from 'ethers/providers';
import moment from 'moment';
import { range } from 'ramda';
import Web3 from 'web3';
import winston, { format } from 'winston';
import { AuctionResult, Team } from './contracts';
import State from './state';

const { abi: gameAbi } = require('../build/contracts/Game.json');
const { abi: auctionAbi } = require('../build/contracts/Auction.json');

import { Auction } from '../types/ethers-contracts/Auction';
import { AuctionFactory } from '../types/ethers-contracts/AuctionFactory';
import { Game } from '../types/ethers-contracts/Game';
import { GameFactory } from '../types/ethers-contracts/GameFactory';

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
        endTime: utils.BigNumber
      ) => {
        logger.info('HigestBidPlaced');

        this.handleBidPlaced(team, endTime.toNumber() * 1000);
      }
    );
  }

  private async setup() {
    await this.setupForTeam(Team.red);
    await this.setupForTeam(Team.blue);
  }

  private async setupForTeam(team: Team) {
    const auctionsCount = await this.instance.functions.getAuctionsCount(team);

    const auctionAddresses = await Promise.all(
      range(0, auctionsCount.toNumber()).map(n =>
        this.instance.functions.getAuctionByIndex(team, n)
      )
    );

    const auctionResults = await Promise.all(
      auctionAddresses.map(async address => {
        const auction = this.getAuctionAtAddress(address);

        const [move, result] = await Promise.all([
          auction.functions.getLeadingMove(),
          auction.functions.result(),
        ]);

        return { move, result: result as AuctionResult };
      })
    );

    this.state.setMovesMade(team, auctionResults);

    const currentAuction = await this.getCurrentAuctionForTeam(team).catch(
      e => null
    ); // Swallow error, auction wont exist yet

    if (!currentAuction) {
      return;
    }

    if (await this.auctionNeedsToHaveMovedConfirmed(currentAuction)) {
      this.confirmMove(currentAuction, team);
    } else if (!(await currentAuction.functions.hasEnded())) {
      const endTime = await currentAuction.functions.getEndTime();
      logger.debug('END TIME', endTime.toString(), endTime.toNumber());
      if (endTime.isZero()) {
        // Auction not yet started
        logger.info(
          `Running auction (${currentAuction.address})for team ${Team[team]} has not yet got an end time`,
          await currentAuction.functions.hasEnded()
        );
        return;
      }
      await this.createPendingConfirmation(
        team,
        currentAuction,
        endTime.toNumber() * 1000
      );
    }
  }

  private async handleBidPlaced(team: Team, endTime: number) {
    const otherTeam = this.otherTeam(team);

    logger.info(
      `Checking if other team (${Team[otherTeam]}) needs auction created`
    );
    // Start auction if necessary
    const otherAuction = await this.getCurrentAuctionForTeam(otherTeam).catch(
      e => null
    ); // Swallow error, auction wont exist yet

    if (!otherAuction || (await otherAuction.functions.hasEnded())) {
      logger.info(
        `Starting auction for other team (${Team[otherTeam]})`,
        await this.instance.estimate.startAuction(otherTeam)
      );
      await this.instance.functions.startAuction(otherTeam).catch(e => {
        logger.error('Failed to start auction for other team', e);
        throw e;
      });
    }

    this.createPendingConfirmation(
      team,
      await this.getCurrentAuctionForTeam(team),
      endTime
    );
  }

  private createPendingConfirmation(
    team: Team,
    auction: Auction,
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

  private async confirmMove(auction: Auction, team: Team, retries = 1) {
    // For some reason this is thinking it hasn't ended

    // if (!await auction.functions.hasEnded()) {
    //   const endTime = await auction.functions.getEndTime();
    //   logger.debug('END TIME', endTime.toNumber(), Date.now()/1000);
    //   logger.debug(`Auction has not yet ended for ${Team[team]} team, cannot confirm`);
    //   // TODO need to limit recursion
    //   // this.createPendingConfirmation(team, auction, endTime.toNumber() * 1000);
    //   return;
    // }

    // Check if hit or miss
    const leadingMove = await auction.functions.getLeadingMove();

    const hit = this.state.setMoveMade(team, leadingMove[0], leadingMove[1]);

    // TODO check if game is won

    // Set move on game and possibly start next auction
    await this.instance.functions.confirmMove(team, hit).catch(async e => {
      // TODO try to filter by e.message === 'Failed to confirm move', needs testing on mainnet
      if (retries > 0) {
        // Wait 10% of auction time to try again
        const time =
          (await this.instance.functions.auctionDuration()).toNumber() *
          100; /* 1000 / 10 */
        await new Promise(resolve => {
          setTimeout(resolve, time);
        });

        return this.confirmMove(auction, team, retries - 1);
      }
      logger.error('Failed to confirm move', e.message, e);
      throw e;
    });

    logger.info('Success confirming move');
  }

  private getAuctionAtAddress(address: string) {
    return AuctionFactory.connect(
      address,
      this.instance.signer || this.instance.provider
    );
  }

  private async getCurrentAuctionForTeam(team: Team): Promise<Auction> {
    const auctionAddress = await this.instance.functions.getCurrentAuction(
      team
    );
    return this.getAuctionAtAddress(auctionAddress);
  }

  private async auctionNeedsToHaveMovedConfirmed(
    auction: Auction
  ): Promise<boolean> {
    return (
      (await auction.functions.hasEnded()) &&
      (await auction.functions.result()) === AuctionResult.unset
    );
  }

  private otherTeam(team: Team): Team {
    return Team[team] === Team[Team.red] ? Team.blue : Team.red;
  }
}
