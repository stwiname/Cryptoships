import Web3 from 'web3';
import { Team, AuctionResult } from './contracts';
import moment from 'moment';
import { range } from 'ramda';
import { utils, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import State from './state';
const { abi: gameAbi } = require('../build/contracts/Game.json');
const { abi: auctionAbi } = require('../build/contracts/Auction.json');

import { GameFactory } from '../types/ethers-contracts/GameFactory';
import { Game } from '../types/ethers-contracts/Game';
import { AuctionFactory } from '../types/ethers-contracts/AuctionFactory';
import { Auction } from '../types/ethers-contracts/Auction';

export default class Oracle {

  private timeouts: Partial<Record<Team, NodeJS.Timeout>> = {};

  public static create(
    signerOrProvider: Signer | Provider,
    contractAddress: string,
    state: State,
  ) {

    return new Oracle(
      GameFactory.connect(contractAddress, signerOrProvider),
      state
    );
  }

  constructor(
    private instance: Game,
    private state: State
  ) {
    console.log(`Running oracle for game at ${instance.address}`)
    this.setup()
      .then(() => console.log('Setup success'))
      .catch(e => console.log('Setup failed', e));

    instance.on('HighestBidPlaced', (team: Team, bidder: string, amount: utils.BigNumber, move: [number, number], endTime: utils.BigNumber) => {
      console.log("HigestBidPlaced");

      this.handleBidPlaced(team, endTime.toNumber() * 1000);
    });

  }

  private async setup() {
    await this.setupForTeam(Team.red);
    await this.setupForTeam(Team.blue);
  }

  private async setupForTeam(team: Team) {

    const auctionsCount = await this.instance.functions.getAuctionsCount(team);

    const auctionAddresses = await Promise.all(
      range(0, auctionsCount.toNumber()).map(n => this.instance.functions.getAuctionByIndex(team, n))
    );

    const auctionResults = await Promise.all(auctionAddresses.map( async (address) => {
      const auction = this.getAuctionAtAddress(address);

      const [move, result] = await Promise.all([
        auction.functions.getLeadingMove(),
        auction.functions.result()
      ]);

      return { move, result: result as AuctionResult };
    }));

    this.state.setMovesMade(team, auctionResults);

    const auction = await this.getCurrentAuctionForTeam(team)
      .catch(e => null); // Swallow error, auction wont exist yet

    if (!auction) {
      return;
    }

    if (await this.auctionNeedsToHaveMovedConfirmed(auction)) {
      this.confirmMove(auction, team);
    }
    else {
      const endTime = await auction.functions.getEndTime();
      console.log('END TIME', endTime.toString(), endTime.toNumber());
      if (endTime.isZero()) {// Auction not yet started
        console.log(
          `Running auction (${auction.address})for team ${Team[team]} has not yet got an end time`,
          await auction.functions.hasEnded(),
        );
        return;
      }
      await this.createPendingConfirmation(team, auction, endTime.toNumber() * 1000);
    }
  }


  private async handleBidPlaced(team: Team, endTime: number) {
    const otherTeam = this.otherTeam(team);

    console.log(`Checking if other team (${Team[otherTeam]}) needs auction created`, );
    // Start auction if necessary
    const otherAuction = await this.getCurrentAuctionForTeam(otherTeam)
      .catch(e => null); // Swallow error, auction wont exist yet

    if (!otherAuction || await otherAuction.functions.hasEnded()) {
      console.log(`Starting auction for other team (${Team[otherTeam]})`, (await this.instance.estimate.startAuction(otherTeam)));
      await this.instance.functions.startAuction(otherTeam)
        .catch((e) => {
          console.log('Failed to start auction for other team', e);
          throw e;
        });
    }

    this.createPendingConfirmation(team, await this.getCurrentAuctionForTeam(team), endTime);
  }

  private createPendingConfirmation(team: Team, auction: Auction, endTime: number) {
    // We already have a timeout for this
    // TODO do we need to check its for the same auction?
    if (this.timeouts[team]) {
      return;
    }

    console.log(`Creating pending confirmation for ${Team[team]} team`);
    this.timeouts[team] = setTimeout(() => {
      console.log(`Confirming move for ${Team[team]} team`, Date.now(), endTime);
      this.confirmMove(auction, team);

      delete this.timeouts[team];
    }, endTime - Date.now() + 2000);
  }


  private async confirmMove(auction: Auction, team: Team) {

    // For some reason this is thinking it hasn't ended

    // if (!await auction.functions.hasEnded()) {
    //   const endTime = await auction.functions.getEndTime();
    //   console.log('END TIME', endTime.toNumber(), Date.now()/1000);
    //   console.log(`Auction has not yet ended for ${Team[team]} team, cannot confirm`);
    //   // TODO need to limit recursion
    //   // this.createPendingConfirmation(team, auction, endTime.toNumber() * 1000);
    //   return;
    // }

    // Check if hit or miss
    const leadingMove = await auction.functions.getLeadingMove();

    const hit = this.state.setMoveMade(
      team,
      leadingMove[0],
      leadingMove[1]
    );

    // TODO check if game is won

    // Set move on game and possibly start next auction
    await this.instance.functions.confirmMove(team, hit)
      .catch(e => {
        console.log('Failed to confirm move', e);
        throw e;
      });

    console.log('Success confirming move');
  }

  private getAuctionAtAddress(address: string) {
    return AuctionFactory.connect(address, this.instance.signer || this.instance.provider);
  }

  private async getCurrentAuctionForTeam(team: Team): Promise<Auction> {
    const auctionAddress = await this.instance.functions.getCurrentAuction(team);
    return this.getAuctionAtAddress(auctionAddress);
  }

  private async auctionNeedsToHaveMovedConfirmed(auction: Auction): Promise<boolean> {
    return await auction.functions.hasEnded() &&
          (await auction.functions.result()) === AuctionResult.unset
  }

  private otherTeam(team: Team): Team {
    return Team[team] === Team[Team.red] ? Team.blue : Team.red;
  }

}