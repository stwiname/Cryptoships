import { utils } from 'ethers';
import append from 'ramda/src/append';
import range from 'ramda/src/range';
import uniqBy from 'ramda/src/uniqBy';
import concat from 'ramda/src/concat';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3React } from '@web3-react/core';
import { AuctionFactory } from 'contracts/types/ethers-contracts/AuctionFactory';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { Game as GameInstance } from 'contracts/types/ethers-contracts/Game';
import { LeadingBid, AuctionResult, Team, GameResult } from '../contracts';
import useEventListener from '../hooks/useEventListener';
import useContract from '../hooks/useContract';
import CancellablePromise, { PromiseCancelledError, logNotCancelledError } from '../cancellablePromise';

export type AuctionMove = {
  move: number[];
  result: AuctionResult;
  address: string; // Auction address
};

function useGame(contractAddress: string) {
  const context = useWeb3React();
  const game = useContract(contractAddress, GameFactory.connect);

  if (!context.active || context.error) {
    throw new Error('Web3 context not setup!!');
  }

  if (!contractAddress) {
    return null;
  }

  const [error, setError] = useState<Error>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fieldSize, setFieldSize] = useState<number>(0);
  const [result, setResult] = useState<GameResult>(GameResult.unset);
  const [redAuctionAddress, setRedAuctionAddress] = useState<string>(null);
  const [blueAuctionAddress, setBlueAuctionAddress] = useState<string>(null);
  const [redAuctionResults, setRedAuctionResults] = useState<AuctionMove[]>([]);
  const [blueAuctionResults, setBlueAuctionResults] = useState<AuctionMove[]>(
    []
  );
  const [redLeadingBid, setRedLeadingBid] = useState<LeadingBid>(null);
  const [blueLeadingBid, setBlueLeadingBid] = useState<LeadingBid>(null);

  const updateAuctionResults = (existing: AuctionMove[], newMoves: AuctionMove[]) => 
    {
      const up = uniqBy<AuctionMove, number[]>(a => a.move, concat(existing, newMoves))
      console.log("Moves", up)
      return up;
    }

  const clearState = () => {
    setError(null);
    setLoading(false);
    setFieldSize(0);
    setResult(GameResult.unset);
    setRedAuctionAddress(null);
    setBlueAuctionAddress(null);
    setRedAuctionResults([]);
    setBlueAuctionResults([]);
    setRedLeadingBid(null);
    setBlueLeadingBid(null);
  }

  useEffect(() => {
    clearState();
  }, [contractAddress]);

  useEffect(() => {
    // Reset all values
    clearState();
    if (!game) {
      return;
    }

    setLoading(true);

    const tasks = CancellablePromise.all([
      CancellablePromise.makeCancellable(game.functions.getFieldSize())
        .map(setFieldSize)
        .mapError((e: Error) => {
          if (e instanceof PromiseCancelledError) {
            return;
          }
          console.log('Failed to get field size', e);
          setError(e);
        }),
      // Get final game result
      CancellablePromise.makeCancellable(game.functions.getResult())
        .map(setResult)
        .mapError(logNotCancelledError(`Failed to get game result`)),
      // Get current auctions
      CancellablePromise.makeCancellable(game.functions.getCurrentAuction(Team.red))
        .map(setRedAuctionAddress)
        .mapError(logNotCancelledError(`Failed to get auction for red team`)),
      CancellablePromise.makeCancellable(game.functions.getCurrentAuction(Team.blue))
        .map(setBlueAuctionAddress)
        .mapError(logNotCancelledError(`Failed to get auction for blue team`)),
      // Get results
      CancellablePromise.makeCancellable(getAllResultsForTeam(game, Team.red))
        .map(results => setRedAuctionResults(updateAuctionResults(redAuctionResults, results)))
        .mapError(logNotCancelledError('Failed to get auction results for red team')),
      CancellablePromise.makeCancellable(getAllResultsForTeam(game, Team.blue))
        .map(results => setBlueAuctionResults(updateAuctionResults(blueAuctionResults, results)))
        .mapError(logNotCancelledError('Failed to get auction results for blue team')),
    ]);

    return tasks.cancel;
  }, [game]);

  useEffect(() => {

    let timeout: NodeJS.Timeout;

    if (loading && (error || fieldSize)) {
      timeout = setTimeout(() => setLoading(false), 1500);
    }

    return () => clearTimeout(timeout);
  }, [error, loading, fieldSize]);

  useEventListener(
    'HighestBidPlaced',
    (
      team: Team,
      bidder: string,
      amount: utils.BigNumber,
      move: [number, number],
      endTime: utils.BigNumber
    ) => {
      console.log('Highest bid placed', Team[team]);
      const setLeadingBid =
        Team[team] === Team[Team.red] ? setRedLeadingBid : setBlueLeadingBid;

      setLeadingBid({ bidder, amount, move });
    },
    game
  );

  useEventListener(
    'MoveConfirmed',
    (
      team: Team,
      hit: boolean,
      move: [number, number],
      auctionAddress: string
    ) => {
      const setAuctionResults =
        Team[team] === Team[Team.red]
          ? setRedAuctionResults
          : setBlueAuctionResults;
      const auctionResults = getTeamAuctionResults(team);
      const auctionMove: AuctionMove = {
        move,
        result: hit ? AuctionResult.hit : AuctionResult.miss,
        address: auctionAddress,
      };
      console.log(`Move confirmed, ${JSON.stringify(auctionMove)}`);
      setAuctionResults(updateAuctionResults(auctionResults, [auctionMove]));
    },
    game
  );

  useEventListener(
    'AuctionCreated',
    (team: Team, newAuctionAddress: string) => {
      const setAuctionAddress =
        Team[team] === Team[Team.red]
          ? setRedAuctionAddress
          : setBlueAuctionAddress;
      console.log(`Auction created ${Team[team]} ${newAuctionAddress}`);
      setAuctionAddress(newAuctionAddress);
    },
    game
  );

  useEventListener(
    'GameCompleted',
    (winningTeam: Team) => {
      console.log(`Game won by ${Team[winningTeam]}`);

      // TODO set result of final move
      setResult(
        Team[winningTeam] === Team[Team.red]
          ? GameResult.redWinner
          : GameResult.blueWinner
      );
    },
    game
  );

  const getAllResultsForTeam = async (
    game: GameInstance,
    team: Team
  ): Promise<AuctionMove[]> => {
    const auctionsCount = await game.functions.getAuctionsCount(team);

    const auctionAddresses = await Promise.all(
      range(0, auctionsCount).map(n =>
        game.functions.getAuctionByIndex(team, n)
      )
    );

    const results = await Promise.all(
      auctionAddresses.map(async address => {
        const auction = AuctionFactory.connect(
          address,
          context.library
        );

        const [move, result, ended] = await Promise.all([
          auction.functions.getLeadingMove(),
          auction.functions.getResult(),
          auction.functions.hasEnded(),
        ]);

        // Allows excluding unfinished auctions
        if (!ended) {
          return null;
        }

        return { move, result: result as AuctionResult, address };
      })
    );

    return results.filter(Boolean);
  };

  const getTeamAuctionAddress = (team: Team) =>
    Team[team] === Team[Team.red] ? redAuctionAddress : blueAuctionAddress;

  const getTeamAuctionResults = (team: Team) =>
    Team[team] === Team[Team.red] ? redAuctionResults : blueAuctionResults;

  const getTeamLeadingBid = (team: Team) =>
    Team[team] === Team[Team.red] ? redLeadingBid : blueLeadingBid;

  return {
    error,
    loading,
    fieldSize,
    getTeamAuctionAddress,
    getTeamAuctionResults,
    getTeamLeadingBid,
    result
  };
}

const Game = createContainer(useGame);

export default Game;
