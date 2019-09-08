import Web3 from 'web3';
import { Game } from '../types/web3-contracts/Game';
import { Auction } from '../types/web3-contracts/Auction';
import { Team, AuctionResult } from './contracts';
import moment from 'moment';
import State from './state';
const { abi: gameAbi } = require('../build/contracts/Game.json');
const { abi: auctionAbi } = require('../build/contracts/Auction.json');

const ORACLE_ACCOUNT = '0x57c75395a513a3462b3e22b6d49b1ff2bc9da8d1';

const web3 = new Web3('ws://localhost:9545');

export default class Oracle {

  private timeouts: Partial<Record<Team, NodeJS.Timeout>> = {};

  public static create(
    web3: Web3,
    contractAddress: string,
    oracleAddress: string,
    state: State,
  ) {

    return new Oracle(
      web3,
      new web3.eth.Contract(gameAbi, contractAddress) as Game,
      oracleAddress,
      state
    );
  }

  constructor(
    private web3: Web3,
    private instance: Game,
    private oracleAddress: string,
    private state: State
  ) {
    this.setup()
      .then(() => console.log('Setup success'))
      .catch(e => console.log('Setup failed', e));


    instance.events.HighestBidPlaced({}, (error, event) => {
      if (error) {
        console.log('HigestBidPlaced error', error);
        return;
      }

      console.log("HigestBidPlaced"/*, event.returnValues*/);

      // Bad ts definition for numbers
      const { team, endTime }: { team: unknown, endTime: unknown} = event.returnValues;

      this.handleBidPlaced(team as number, endTime as number * 1000);
    });
  }

  private async setup() {
    await this.setupForTeam(Team.red);
    await this.setupForTeam(Team.blue);
  }

  private async setupForTeam(team: Team) {

    const { 0: moves, 1: results }: { 0: unknown[][], 1: unknown[]} = await this.instance.methods.getAllAuctionResults(team).call();

    const auctionResults = moves.map((move, index) => (
      { move: move as number[], result: results[index] as AuctionResult }
    ));

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
      const endTime: unknown = await auction.methods.getEndTime().call();
      await this.createPendingConfirmation(team, auction, endTime as number * 1000);
    }
  }


  private async handleBidPlaced(team: Team, endTime: number) {
    const otherTeam = this.otherTeam(team);

    console.log(`Checking if other team (${Team[otherTeam]}) needs auction created`, );
    // Start auction if necessary
    const otherAuction = await this.getCurrentAuctionForTeam(otherTeam)
      .catch(e => null); // Swallow error, auction wont exist yet

    if (!otherAuction || await otherAuction.methods.hasEnded().call()) {
      console.log(`Starting auction for other team (${Team[otherTeam]})`, await this.instance.methods.startAuction(otherTeam).estimateGas());
      await this.instance.methods.startAuction(otherTeam).send({ from: this.oracleAddress, gas: 1000000 })
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
    if (!await auction.methods.hasEnded().call()) {
      // const endTime: unknown = await auction.methods.getEndTime().call();
      console.log(`Auction has not yet ended for ${Team[team]} team, cannot confirm`);
      // This should retry again
      return;
    }

    // Check if hit or miss
    const leadingMove: unknown[] = await auction.methods.getLeadingMove().call();

    const hit = this.state.setMoveMade(
      team,
      leadingMove[0] as number,
      leadingMove[1] as number
    );

    // TODO check if game is won

    // Set move on game and possibly start next auction
    await this.instance.methods.confirmMove(team, hit)
      .send({ from: this.oracleAddress })
      .catch(e => {
        console.log('Failed to confirm move', e);
        throw e;
      });

    console.log('Success confirming move');
  }

  private getAuctionAtAddress(address: string) {
    return new this.web3.eth.Contract(auctionAbi, address) as Auction;
  }

  private async getCurrentAuctionForTeam(team: Team): Promise<Auction> {
    const auctionAddress = await this.instance.methods.getCurrentAuction(team).call();
    return this.getAuctionAtAddress(auctionAddress);
  }

  private async auctionNeedsToHaveMovedConfirmed(auction: Auction): Promise<boolean> {
    return await auction.methods.hasEnded().call() &&
          (await auction.methods.result().call()).toNumber() === AuctionResult.unset
  }

  private otherTeam(team: Team): Team {
    return Team[team] === Team[Team.red] ? Team.blue : Team.red;
  }

}