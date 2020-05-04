import { utils } from 'ethers';
import LogDecoder from './LogDecoder';
import { battleFieldToBuffer, computeFieldHash } from 'oracle/lib/generator';
import { GameContract, GameInstance } from '../types/truffle-contracts';
const GameLib = artifacts.require('GameLib');
const Game: GameContract = artifacts.require('Game');
const AuctionLib = artifacts.require('AuctionLib');
const Auction = artifacts.require('Auction');
import {
  advanceTimeAndBlock,
  snapshotEvm,
  revertEvm,
  assertEvent,
  assertAuctionBid,
  getGasInfo,
} from './util';

const { abi: gameAbi } = require('../build/contracts/Game.json');
const { abi: gameLibAbi } = require('../build/contracts/GameLib.json');
const { abi: auctionAbi } = require('../build/contracts/Auction.json');
const { abi: auctionLibAbi } = require('../build/contracts/AuctionLib.json');

const testBattleField = [[false, true], [true, false]];
const redHash = computeFieldHash(testBattleField);
const blueHash = computeFieldHash(testBattleField);

enum Team {
  red,
  blue,
};

const AUCTION_TIME = 10;

const expectFailingPromise = async (promise: Promise<any>, errorMessage?: string) => {
  try {
    await promise;
  }
  catch(e) {
    if (errorMessage) {
      expect(e.message).to.equal(errorMessage);
      return;
    }
    expect(e).to.not.be.null;
    return;
  }

  assert.isOk(false, 'Expected an error');
}

contract('Game', accounts => {
  const oracleAccount = accounts[0];
  let snapshotId;

  const logDecoder = new LogDecoder([gameAbi, gameLibAbi, auctionAbi, auctionLibAbi]);

  async function getBalance(index: number) {
    return new utils.BigNumber(await web3.eth.getBalance(accounts[index]));
  }

  before(async () => {
    const auctionLibrary = await AuctionLib.new();
    await (GameLib as any).link("AuctionLib", auctionLibrary.address);
    const gameLibrary = await GameLib.new();
    await (Auction as any).link("AuctionLib", auctionLibrary.address);
    await (Game as any).link("AuctionLib", auctionLibrary.address);
    await (Game as any).link("GameLib", gameLibrary.address);
  });

  beforeEach(async () => {
    snapshotId = await snapshotEvm();
  });

  afterEach(async () => {
    await revertEvm(snapshotId);
  });

  describe('initialisation', () => {
    it('should not be able to create a game with units greater than the field size', async () => {

      await expectFailingPromise(Game.new(redHash, blueHash, 2, 5, AUCTION_TIME, Team.red, {
        from: accounts[1],
      }));
    });
  });

  describe('game without oracle', () => {
    let instance: GameInstance = null;

    const bidAmount = 1000;

    const placeBidForCurrentAuction = async(team: Team, position: [number, number], amount: string, accountNumber: number) => {
      const index = await instance.getCurrentAuctionIndex(team);

      return instance.placeBid(position, team, index, { from: accounts[accountNumber], value: amount});
    }

    const playMoveAndStartOtherTeam = async (team: Team, position: [number, number], accountNumber: number) => {
      await placeBidForCurrentAuction(team, position, bidAmount.toString(), accountNumber);


      // Atempt to start auction for other team
      let otherAuction: any = null;
      const otherTeam = team === Team.red ? Team.blue : Team.red;
      try {
        otherAuction = await instance.getCurrentAuction(otherTeam);
      }
      catch(e) {
        // Do nothing aution wont exist
      }
    }

    const playMoveAndCompleteAuction = async (team: Team, position: [number, number], accountNumber: number) => {
      await playMoveAndStartOtherTeam(team, position, accountNumber);

      // Time out auction for move made
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Confirm the move for the auction just made
      const index = await instance.getCurrentAuctionIndex(team);
      await instance.confirmMove(
        team,
        testBattleField[position[0]][position[1]],
        index,
        { from: oracleAccount }
      );
    }

    beforeEach(async () => {
      instance = await Game.new(redHash, blueHash, 2, 1, AUCTION_TIME, Team.red, {
        from: oracleAccount,
      });
    });

    it('should not be able to make a move outside the field', async () => {

      await expectFailingPromise(placeBidForCurrentAuction(Team.red, [0, 2], '1', 1));
      await expectFailingPromise(placeBidForCurrentAuction(Team.red, [2, 0], '1', 1));
    });

    it('should be able to check that a move has not been made', async () => {
      const beenMade = await instance.hasMoveBeenMade(Team.red, [0, 0]);

      expect(beenMade).to.be.false;
    });

    it('should be able to make a move', async () => {
      await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      const { leadingBid } = await instance.getCurrentAuction(Team.red);

      assertAuctionBid(leadingBid, {
        move: [0, 0],
        amount: 1,
        bidder: accounts[1],
      });
    });

    it('should not be able to start the auction for the 2nd team before 1st team bids', async () => {
      await expectFailingPromise(instance
        .startAuction(Team.blue, { from: oracleAccount })
      );
    });

    // No longer relevant because the blue auction will not exist
    xit('should be able to make a move for the other team before the auction has started', async () => {
      const redAuction = await Auction.at(await instance.getCurrentAuction(Team.red));
      await redAuction.placeBid([0, 0], {
        from: accounts[1],
        value: '1',
      });

      const blueAuction = await Auction.at(await instance.getCurrentAuction(Team.blue));

      await expectFailingPromise(blueAuction
        .placeBid([0, 0], { from: accounts[2], value: '1' })
      );
    });

    it('should be able to outbid a move', async () => {
      await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);
      await placeBidForCurrentAuction(Team.red, [0, 0], '2', 1);
    });

    it('should be able to make a move for the other team after half first auction time', async () => {
      await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      await advanceTimeAndBlock(AUCTION_TIME);

      await placeBidForCurrentAuction(Team.blue, [0, 0], '1', 2);
    });

    it('should not be able to make a move for the other team before half first auction time', async () => {
      await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      await expectFailingPromise(placeBidForCurrentAuction(Team.blue, [0, 0], '1', 2));
    });

    it('should be able to get the end time after a bid has been placed', async () => {
      await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      const { endTime } = await instance.getCurrentAuction(Team.red);

      const endBN = new utils.BigNumber(endTime as any);

      expect(!endBN.isZero());
      expect(endBN.toNumber() * 1000).to.be.gt(Date.now());
    });

    it('should be able to make a move and emit an event', async () => {
      const result = await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      const { args } = logDecoder.decodeLogs(result.receipt.rawLogs)[1];

      expect(args.team).to.equal(Team.red);
      expect(args.endTime.toNumber()).to.be.below(
        new Date().getTime() + AUCTION_TIME
      );

      assertAuctionBid(args, { move: [0, 0], amount: 1, bidder: accounts[1] });
    });

    it('should be able to set the result once the auction is finished', async () => {
      const result = await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      // Wait until the auction has finished

      // Firse event is auction created
      const { args } = logDecoder.decodeLogs(result.receipt.rawLogs)[1];
      const advance =
        args.endTime.toString() * 1000 - new Date().getTime();
      await advanceTimeAndBlock(advance);

      const index = await instance.getCurrentAuctionIndex(Team.red);

      await instance.confirmMove(Team.red, true, index, { from: oracleAccount });
    });

    it('should be able to set the auction result and play again, once the other team has played', async () => {
      const result = await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      // Wait until the auction has finished
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Starts blue auction
      const index = await instance.getCurrentAuctionIndex(Team.red);
      await instance.confirmMove(Team.red, true, index, { from: oracleAccount });

      await placeBidForCurrentAuction(Team.blue, [0, 1], '1', 2);

      await advanceTimeAndBlock(AUCTION_TIME + 1);

      await placeBidForCurrentAuction(Team.red, [0, 1], '1', 1);
    });

    it('should not be able to play the same move twice', async () => {
      const result = await placeBidForCurrentAuction(Team.red, [0, 0], '1', 1);

      // Wait until the auction has finished
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Starts blue auction
      const index = await instance.getCurrentAuctionIndex(Team.red);
      await instance.confirmMove(Team.red, true, index, { from: oracleAccount });

      await placeBidForCurrentAuction(Team.blue, [0, 1], '1', 2);

      await expectFailingPromise(placeBidForCurrentAuction(Team.red, [0, 0], '1', 1));
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

      await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
      await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);
      await playMoveAndCompleteAuction(Team.red, [1, 0], 1); // Winning move

      const balanceBefore = await getBalance(1);

      const result = await instance.finalize(
        Team.red,
        '0x' + battleFieldToBuffer(testBattleField).toString('hex'),
        utils.formatBytes32String('') // Empty bytes 32
      );

      const withdrawl = await instance.withdraw({ from: accounts[1] });

      const gas = await getGasInfo(withdrawl);

      const balanceAfter = await getBalance(1);

      const expectedBalance = balanceBefore
          .sub(gas.used.mul(gas.price)) // Tx fee to withdraw
          .add(new utils.BigNumber(bidAmount)) // Refund first bid
          .add(new utils.BigNumber(bidAmount)) // Refund second bid
          .add(new utils.BigNumber(bidAmount * 0.9)); // Winnings;

      assert.equal(
        expectedBalance.toString(),
        balanceAfter.toString()
      );
    });

    it('should be able to confirm moves out of order', async () => {
      // Red has 2 auctions, blue 1, reds first auction is not confirmed and
      // we cannnot currently confirm it because it reverts creating another auction

      await playMoveAndStartOtherTeam(Team.red, [0, 1], 1);

      const firstAuction = await instance.getCurrentAuctionIndex(Team.red);

      await advanceTimeAndBlock(AUCTION_TIME + 1);

      await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);

      // Time out auction for move made
      await advanceTimeAndBlock(AUCTION_TIME + 1);

      // Confirm the move for the first auction
      await instance.confirmMove(
        Team.red,
        testBattleField[0][1],
        firstAuction,
        { from: oracleAccount }
      );
    });

    it('should not be able to play a move after game finalized', async() => {

      await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
      await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);
      await playMoveAndCompleteAuction(Team.red, [1, 0], 1); // Winning move

      const balanceBefore = await getBalance(1);

      const result = await instance.finalize(
        Team.red,
        '0x' + battleFieldToBuffer(testBattleField).toString('hex'),
        utils.formatBytes32String('') // Empty bytes 32
      );

      await expectFailingPromise(playMoveAndCompleteAuction(Team.red, [1, 1], 2));
      await expectFailingPromise(playMoveAndCompleteAuction(Team.blue, [1, 0], 2));
    });

    describe('Potential winnings', () => {

      it('should be 0 when only no team has played a move', async () => {
        const winningsBlue = await instance.getPotentialWinnings(accounts[3], Team.blue);

        // expect(winningsRed.isZero()).to.be.true;
        expect(winningsBlue.isZero()).to.be.true;
      });

      it('should be 0 when only one team has played a move', async () => {
        await playMoveAndCompleteAuction(Team.red, [0, 1], 1);

        const winningsBlue = await instance.getPotentialWinnings(accounts[3], Team.blue);

        // expect(winningsRed.isZero()).to.be.true;
        expect(winningsBlue.isZero()).to.be.true;
      });

      it('should be 0 for a player who made no moves, with auctions', async () => {
        await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
        await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);

        const winningsRed = await instance.getPotentialWinnings(accounts[3], Team.red);
        const winningsBlue = await instance.getPotentialWinnings(accounts[3], Team.blue);

        expect(winningsRed.isZero()).to.be.true;
        expect(winningsBlue.isZero()).to.be.true;
      });

      it('should be 0 for the other team, with auctions', async () => {
        await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
        await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);

        const winnings = await instance.getPotentialWinnings(accounts[1], Team.blue);

        expect(winnings.isZero()).to.be.true;
      });

      it('should be able to be checked', async () => {

        await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
        await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);

        const winnings1: utils.BigNumber = (await instance.getPotentialWinnings(accounts[1], Team.red)) as any;
        const winnings2: utils.BigNumber = (await instance.getPotentialWinnings(accounts[2], Team.blue)) as any;

        // Each winning bid made by the player + share of the losing team
        const expectedWinnings = new utils.BigNumber(bidAmount).div(10).mul(9).add(bidAmount);

        expect(winnings1.toString()).to.equal(expectedWinnings.toString());
        expect(winnings2.toString()).to.equal(expectedWinnings.toString());
      });
    });


    it('should fail to withdraw a second time', async() => {

      await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
      await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);
      await playMoveAndCompleteAuction(Team.red, [1, 0], 1); // Winning move

      const result = await instance.finalize(
        Team.red,
        '0x' + battleFieldToBuffer(testBattleField).toString('hex'),
        utils.formatBytes32String('') // Empty bytes 32
      );

      await instance.withdraw({ from: accounts[1] });
      await expectFailingPromise(instance.withdraw({ from: accounts[1] }))
        // .catch((e: Error) => expect(e).to.not.be.null);
    });

    it('should fail to withdraw after deadline', async() => {

      await playMoveAndCompleteAuction(Team.red, [0, 1], 1);
      await playMoveAndCompleteAuction(Team.blue, [0, 0], 2);
      await playMoveAndCompleteAuction(Team.red, [1, 0], 1); // Winning move

      const result = await instance.finalize(
        Team.red,
        '0x' + battleFieldToBuffer(testBattleField).toString('hex'),
        utils.formatBytes32String('') // Empty bytes 32
      );

      const deadline = await instance.getWithdrawDeadline();

      // Should fail because deadline not passed
      await expectFailingPromise(instance.withdrawRemainder(accounts[1], { from: accounts[0] }));
        // .catch((e: Error) => expect(e).to.not.be.null);

      // Reach deadline
      await advanceTimeAndBlock(604800 + 100); // 7 Days + buffer

      await expectFailingPromise(instance.withdraw({ from: accounts[1] }));
        // .catch((e: Error) => expect(e).to.not.be.null);

      await instance.withdrawRemainder(accounts[1], { from: accounts[0] });
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
