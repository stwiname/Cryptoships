import { utils } from 'ethers';
import { append, range, uniqBy, concat } from 'ramda';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3React } from '@web3-react/core';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { Game as GameInstance } from 'contracts/types/ethers-contracts/Game';
import { LeadingBid, AuctionResult, Team, GameResult } from '../contracts';
import { useContract, useEventListener } from '../hooks';
import CancellablePromise, { PromiseCancelledError, logNotCancelledError } from '../cancellablePromise';
import { AuctionExt } from '../contracts';

export type AuctionMove = {
  move: number[];
  result: AuctionResult;
  index: number;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [fieldSize, setFieldSize] = useState<number>(0);
  const [result, setResult] = useState<GameResult>(GameResult.unset);
  const [redAuctionIndex, setRedAuctionIndex] = useState<number>(null);
  const [blueAuctionIndex, setBlueAuctionIndex] = useState<number>(null);
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
    setRedAuctionIndex(null);
    setBlueAuctionIndex(null);
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
      CancellablePromise.makeCancellable(game.functions.getCurrentAuctionIndex(Team.red))
        .map(setRedAuctionIndex)
        .mapError(logNotCancelledError(`Failed to get auction for red team`)),
      CancellablePromise.makeCancellable(game.functions.getCurrentAuctionIndex(Team.blue))
        .map(setBlueAuctionIndex)
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
  }, [game?.address, context.chainId]);

  useEffect(() => {

    let timeout: NodeJS.Timeout;

    if (loading && (error || fieldSize)) {
      timeout = setTimeout(() => setLoading(false), 1500);
    }

    return () => clearTimeout(timeout);
  }, [error, loading, fieldSize]);

  useEventListener(
    game,
    'HighestBidPlaced',
    (
      team: Team,
      bidder: string,
      amount: utils.BigNumber,
      move: [number, number],
      endTime: utils.BigNumber
    ) => {
      console.log('[EVENT] HighestBidPlaced', Team[team]);
      const setLeadingBid =
        Team[team] === Team[Team.red] ? setRedLeadingBid : setBlueLeadingBid;

      setLeadingBid({ bidder, amount, move });
    },
  );

  useEventListener(
    game,
    'MoveConfirmed',
    (
      team: Team,
      hit: boolean,
      move: [number, number],
      auctionIndex: number,
    ) => {
      const setAuctionResults =
        Team[team] === Team[Team.red]
          ? setRedAuctionResults
          : setBlueAuctionResults;
      const auctionResults = getTeamAuctionResults(team);
      const auctionMove: AuctionMove = {
        move,
        result: hit ? AuctionResult.hit : AuctionResult.miss,
        index: auctionIndex,
      };
      console.log(`[EVENT] MoveConfirmed, ${JSON.stringify(auctionMove)}`);
      setAuctionResults(updateAuctionResults(auctionResults, [auctionMove]));
    },
  );

  useEventListener(
    game,
    'AuctionCreated',
    (team: Team, auctionIndex: number) => {
      const setAuctionIndex =
        Team[team] === Team[Team.red]
          ? setRedAuctionIndex
          : setBlueAuctionIndex;
      console.log(`[EVENT] AuctionCreated ${Team[team]} ${auctionIndex}`);
      // Auction canno't be found sometimes without this timeout
      setTimeout(() => setAuctionIndex(auctionIndex), 200);
    },
  );

  useEventListener(
    game,
    'GameCompleted',
    (winningTeam: Team) => {
      console.log(`[EVENT] GameCompleted by ${Team[winningTeam]}`);

      // TODO set result of final move
      setResult(
        Team[winningTeam] === Team[Team.red]
          ? GameResult.redWinner
          : GameResult.blueWinner
      );
    },
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

    const auctions = await Promise.all<AuctionExt>(range(0, auctionsCount).map(async idx => {
      return {
        ...await game.getAuctionByIndex(team, idx),
        hasEnded: await game.hasAuctionEnded(team, idx),
        index: idx
      };
    }));

    return auctions
      .filter(a => a.hasEnded)
      .map(a => ({ move: a.leadingBid.move, result: a.result, index: a.index }));

  };

  const getCurrentAuctionIndex = (team: Team) =>
    Team[team] === Team[Team.red] ? redAuctionIndex : blueAuctionIndex;

  const getTeamAuctionResults = (team: Team) =>
    Team[team] === Team[Team.red] ? redAuctionResults : blueAuctionResults;

  const getTeamLeadingBid = (team: Team) =>
    Team[team] === Team[Team.red] ? redLeadingBid : blueLeadingBid;

  return {
    contractAddress,
    error,
    loading,
    fieldSize,
    getCurrentAuctionIndex,
    getTeamAuctionResults,
    getTeamLeadingBid,
    result,
  };
}

const Game = createContainer(useGame);

export default Game;
