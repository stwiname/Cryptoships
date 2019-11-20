import * as ethers from 'ethers';
// import { Team } from '../lib/contracts';
// import Oracle from '../lib/oracle';
// import State from '../lib/state';
import BN from 'bn.js';
import { battleFieldToBuffer, computeFieldHash } from 'oracle/lib/generator';
import { GameContract, GameInstance } from '../types/truffle-contracts';
const Game: GameContract = artifacts.require('Game');
const Auction = artifacts.require('Auction');
import {
  advanceTimeAndBlock,
  assertEvent,
  assertAuctionBid,
} from './util';

const testBattleField = [[false, true], [true, false]];
const redHash = computeFieldHash(testBattleField)
const blueHash = computeFieldHash(testBattleField)

enum Team {
  red,
  blue,
};

const AUCTION_TIME = 10;

contract('Game', accounts => {
  const oracleAccount = accounts[0];

  async function getBalance(index: number) {
    return new BN(await web3.eth.getBalance(accounts[index]));
  }

  describe('initialisation', () => {
    it('should not be able to create a game with units greater than the field size', async () => {
      await Game.new(redHash, blueHash, 2, 5, AUCTION_TIME, Team.red, {
        from: accounts[1],
      }).catch((e: Error) => expect(e).to.not.be.null);
    });
  });

  describe('game without oracle', () => {
    let instance: GameInstance = null;

    beforeEach(async () => {
      instance = await Game.new(redHash, blueHash, 2, 1, AUCTION_TIME, Team.red, {
        from: oracleAccount,
      });
    });

    it('should not be able to make a move outside the field', async () => {
      await instance
        .placeBid(Team.red, [0, 2], { from: accounts[1], value: '1' })
        .catch((e: Error) => expect(e).not.to.be.null);

      await instance
        .placeBid(Team.red, [2, 0], { from: accounts[1], value: '1' })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to check that a move has not been made', async () => {
      const beenMade = await instance.hasMoveBeenMade(Team.red, [0, 0]);

      expect(beenMade).to.be.false;
    });

    it('should be able to make a move', async () => {
      const tx = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      const auctionAddress = await instance.getCurrentAuction(Team.red);
      const auctionInstance = await Auction.at(auctionAddress);

      const leadingBid = await auctionInstance.getLeadingBid();

      assertAuctionBid(leadingBid, {
        move: [0, 0],
        amount: 1,
        bidder: accounts[1],
      });

      return tx;
    });

    it('should not be able to start the auction for the 2nd team before 1st team bids', async () => {
      await instance
        .startAuction(Team.blue, { from: oracleAccount })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to make a move for the other team before the auction has started', async () => {
      await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      await instance
        .placeBid(Team.blue, [0, 0], { from: accounts[2], value: '1' })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to outbid a move', async () => {
      const result1 = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });
      const result2 = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[2],
        value: '2',
      });
    });

    it('should be able to make a move for the other team after half first auction time', async () => {
      await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      await advanceTimeAndBlock(AUCTION_TIME);

      await instance.startAuction(Team.blue, { from: oracleAccount });

      await instance.placeBid(Team.blue, [0, 0], {
        from: accounts[2],
        value: '1',
      });
    });

    it('should not be able to make a move for the other team before half first auction time', async () => {
      await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      await instance.startAuction(Team.blue, { from: oracleAccount });

      await instance
        .placeBid(Team.blue, [0, 0], { from: accounts[2], value: '1' })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to get the end time after a bid has been placed', async () => {
      await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      const auctionAddress = await instance.getCurrentAuction(Team.red);
      const auction = await Auction.at(auctionAddress);
      const endTime = await auction.getEndTime();

      expect(!endTime.isZero());
      expect(endTime.toNumber() * 1000).to.be.gt(Date.now());
    });

    it('should be able to make a move and emit an event', async () => {
      const result = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      const { args } = result.logs[0];

      expect(args.team.toNumber()).to.equal(Team.red);
      expect(args.endTime.toNumber()).to.be.below(
        new Date().getTime() + AUCTION_TIME
      );

      assertAuctionBid(args, { move: [0, 0], amount: 1, bidder: accounts[1] });
    });

    it('should be able to set the result once the auction is finished', async () => {
      const result = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      // Wait until the auction has finished
      const advance =
        result.logs[0].args.endTime.toString() * 1000 - new Date().getTime();
      await advanceTimeAndBlock(advance);

      await instance.confirmMove(Team.red, true, { from: oracleAccount });
    });

    it('should be able to set the auction result and play again, once the other team has played', async () => {
      const result = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      // Wait until the auction has finished
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Starts blue auction
      await instance.confirmMove(Team.red, true, { from: oracleAccount });

      await instance.placeBid(Team.blue, [0, 1], {
        from: accounts[2],
        value: '1',
      });

      // Red auction is now ready to start because blue bid
      await instance.startAuction(Team.red, { from: oracleAccount });

      await advanceTimeAndBlock(AUCTION_TIME + 1);

      await instance.placeBid(Team.red, [0, 1], {
        from: accounts[1],
        value: '1',
      });
    });

    it('should not be able to play the same move twice', async () => {
      const result = await instance.placeBid(Team.red, [0, 0], {
        from: accounts[1],
        value: '1',
      });

      // Wait until the auction has finished
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Starts blue auction
      await instance.confirmMove(Team.red, true, { from: oracleAccount });

      await instance.placeBid(Team.blue, [0, 1], {
        from: accounts[2],
        value: '1',
      });

      // Red auction is now ready to start because blue bid
      await instance.startAuction(Team.red, { from: oracleAccount });

      await instance
        .placeBid(Team.red, [0, 0], { from: accounts[1], value: '1' })
        .catch((e: Error) => expect(e).not.to.be.null);
    });

    it('should be able to get the number of auctions and get one of them', async () => {
      const count = await instance.getAuctionsCount(Team.red);

      const auction = await instance.getAuctionByIndex(
        Team.red,
        count.toNumber() - 1
      );

      expect(auction).not.to.be.null;
    });

    it('should be able to run a simple game', async() => {

      const bidAmount = 1000;

      const playMoveAndCompleteAuction = async (team: Team, position: [number, number], accountNumber: number) => {
        await instance.placeBid(team, position, {
          from: accounts[accountNumber],
          value: bidAmount.toString(),
        });


        // Atempt to start auction for other team
        let otherTeamAddress: string =  null;
        const otherTeam = team === Team.red ? Team.blue : Team.red;
        try {
          otherTeamAddress = await instance.getCurrentAuction(otherTeam);
        }
        catch(e) {
          // Do nothing aution wont exist
        }

        if (!otherTeamAddress || await Auction.at(otherTeamAddress).then(a => a.hasEnded())) {
          await instance.startAuction(otherTeam, { from: oracleAccount });
        }

        // Time out auction for move made
        await advanceTimeAndBlock(AUCTION_TIME + 1);

        // Confirm the move for the auction just made
        await instance.confirmMove(
          team,
          testBattleField[position[0]][position[1]],
          { from: oracleAccount }
        );
      }

      await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
      await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);
      await playMoveAndCompleteAuction(Team.red, [1, 0], 1); // Winning move

      const balanceBefore = await getBalance(1);

      const result = await instance.finalize(
        Team.red,
        '0x' + battleFieldToBuffer(testBattleField).toString('hex'),
        ethers.utils.formatBytes32String('') // Empty bytes 32
      );

      const balanceAfter = await getBalance(1);

      assert.equal(
        balanceBefore
          .add(new BN(bidAmount)) // Refund first bid
          .add(new BN(bidAmount)) // Refund second bid
          .add(new BN(bidAmount * 0.9)) // Winnings
          .toString(),
        balanceAfter.toString()
      );
    });
  });

  // describe('game with oracle', () => {
  //   let instance: GameInstance = null;
  //   let oracle: Oracle = null;

  //   beforeEach(async () => {
  //     instance = await Game.new(redHash, blueHash, 2, 1, AUCTION_TIME, Team.red, {
  //       from: oracleAccount,
  //     });
  //     const state = new State({
  //       [Team.red]: [[false, false], [false, false]],
  //       [Team.blue]: [[false, false], [false, false]],
  //     });
  //     const provider = new ethers.providers.Web3Provider(web3.currentProvider);
  //     oracle = Oracle.create(
  //       provider.getSigner(accounts[0]),
  //       instance.address,
  //       state
  //     );
  //   });

  //   it('should have the oracle call "confirmMove"', async () => {
  //     await instance.placeBid(Team.red, [0, 0], {
  //       from: accounts[1],
  //       value: '1',
  //     });

  //     const event: any = await new Promise((resolve, reject) => {
  //       (instance as any).MoveConfirmed((error: any, evt: any) => {
  //         if (error) {
  //           reject(error);
  //         }
  //         resolve(evt.returnValues);
  //       });
  //     });

  //     expect(event.team).to.equal(Team.red.toString());
  //     expect(event.move[0]).to.equal('0');
  //     expect(event.move[1]).to.equal('0');
  //   });

  //   it('should have the oracle call "startAuction"', async () => {
  //     await instance.placeBid(Team.red, [0, 0], {
  //       from: accounts[1],
  //       value: '1',
  //     });

  //     // Wait until blue auction has started
  //     await new Promise(resolve => {
  //       setTimeout(resolve, AUCTION_TIME * 1500);
  //     });

  //     await instance.placeBid(Team.blue, [0, 0], {
  //       from: accounts[1],
  //       value: '1',
  //     });
  //   });
  // });
});
