import { GameContract, GameInstance } from '../types/truffle-contracts';

const Game: GameContract = artifacts.require('Game');
const Auction = artifacts.require('Auction');
const { advanceTimeAndBlock, assertEvent, assertAuctionBid } = require('./util');

const AUCTION_TIME = 1000;

const teams = {
  red: 0,
  blue: 1
}

contract('Game', accounts => {

  const oracle = accounts[0];


  describe('initialisation', () => {
    it('should not be able to create a game with units greater than the field size', async () => {
      await Game.new('asdf', 2, 5, AUCTION_TIME, teams.red, { from: accounts[1] })
        .catch((e: Error) => expect(e).to.not.be.null);
    });
  });

  describe('game', () => {
    let instance: GameInstance = null;

    beforeEach(async () => {
      instance = await Game.new('asdf', 2, 1, AUCTION_TIME, teams.red, { from: oracle});
    });

    it('should not be able to make a move outside the field', async () => {
      await instance.placeBid(teams.red, [0, 2], { from: accounts[1], value: '1'})
        .catch((e: Error) => expect(e).not.to.be.null);

      await instance.placeBid(teams.red, [2, 0], { from: accounts[1], value: '1'})
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to check that a move has not been made', async () => {
      const beenMade = await instance.hasMoveBeenMade(teams.red, [0, 0]);

      expect(beenMade).to.be.false;
    });

    it('should be able to make a move', async () => {
      const tx = await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      const auctionAddress = await instance.getCurrentAuction(teams.red);
      const auctionInstance = await Auction.at(auctionAddress);

      const leadingBid = await auctionInstance.getLeadingBid();

      assertAuctionBid(leadingBid, { move: [0, 0], amount: 1, bidder: accounts[1] });

      return tx;
    });

    it('should not be able to start the auction for the 2nd team before 1st team bids', async () => {
      await instance.startAuction(teams.blue, { from: oracle })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to make a move for the other team before the auction has started', async () => {
      await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      await instance.placeBid(teams.blue, [0, 0], { from: accounts[2], value: '1'})
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to outbid a move', async () => {
      const result1 = await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});
      const result2 = await instance.placeBid(teams.red, [0, 0], { from: accounts[2], value: '2'});
    });

    it('should be able to make a move for the other team after half first auction time', async () => {
      await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      await advanceTimeAndBlock(AUCTION_TIME);

      await instance.startAuction(teams.blue, { from: oracle });

      await instance.placeBid(teams.blue, [0, 0], { from: accounts[2], value: '1' });
    });

    it('should not be able to make a move for the other team before half first auction time', async () => {
      await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      await instance.startAuction(teams.blue, { from: oracle });

      await instance.placeBid(teams.blue, [0, 0], { from: accounts[2], value: '1' })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to make a move and emit an event', async () => {
      const result = await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      const { args } = result.logs[0];

      expect(args.team.toNumber()).to.equal(teams.red);
      expect(args.endTime.toNumber()).to.be.below(new Date().getTime() + AUCTION_TIME);

      assertAuctionBid(args, { move: [0, 0], amount: 1, bidder: accounts[1] });
    });

    it('should be able to set the result once the auction is finished', async () => {
      const result = await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      // Wait until the auction has finished
      const advance = result.logs[0].args.endTime.toString() * 1000 - new Date().getTime();
      await advanceTimeAndBlock(advance);

      await instance.confirmMove(teams.red, true, { from: oracle });
    });

    it('should be able to set the auction result and play again, once the other team has played', async () => {
      const result = await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      // Wait until the auction has finished
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Starts blue auction
      await instance.confirmMove(teams.red, true, { from: oracle });

      await instance.placeBid(teams.blue, [0, 1], { from: accounts[2], value: '1'});

      // Red auction is now ready to start because blue bid
      await instance.startAuction(teams.red, { from: oracle });

      await advanceTimeAndBlock(AUCTION_TIME + 1);

      await instance.placeBid(teams.red, [0, 1], { from: accounts[1], value: '1'});

    });

    it('should not be able to play the same move twice', async () => {
      const result = await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'});

      // Wait until the auction has finished
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Starts blue auction
      await instance.confirmMove(teams.red, true, { from: oracle });

      await instance.placeBid(teams.blue, [0, 1], { from: accounts[2], value: '1'});

      // Red auction is now ready to start because blue bid
      await instance.startAuction(teams.red, { from: oracle });

      await instance.placeBid(teams.red, [0, 0], { from: accounts[1], value: '1'})
        .catch((e: Error) => expect(e).not.to.be.null);
    });



  });
  
});