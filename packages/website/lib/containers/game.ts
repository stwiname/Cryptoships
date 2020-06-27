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

const useTeamState = <T extends any>(
  initialState: Record<Team, T> = { [Team.red]: null, [Team.blue]: null }
): [Record<Team, T>, (team: Team, value: T) => void, () => void] => {
  const [state, setState] = useState<Record<Team, T>>(initialState);

  const setForTeam = (team: Team, value: T) => setState(s => ({ ...s, [team]: value }));
  const reset = () => setState(initialState);
  return [state, setForTeam, reset];
}

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
  const [currentAuctionIndexes, setAuctionIndex, resetAuctionIndexes] = useTeamState<number>();
  const [auctionResults, setAuctionResults, resetAucitonResults] = useTeamState<AuctionMove[]>();
  const [leadingBids, setLeadingBid, resetLeadingBids] = useTeamState<LeadingBid>();

  const updateAuctionResults = (existing: AuctionMove[], newMoves: AuctionMove[]) =>
    {
      const up = uniqBy<AuctionMove, number[]>(a => a.move, concat(existing || [], newMoves || []))
      console.log("Moves", up)
      return up;
    }

  const clearState = () => {
    setError(null);
    setLoading(false);
    setFieldSize(0);
    setResult(GameResult.unset);
    resetAuctionIndexes();
    resetAucitonResults();
    resetLeadingBids();
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
        .map((index) => setAuctionIndex(Team.red, index))
        .mapError(logNotCancelledError(`Failed to get auction for red team`)),
      CancellablePromise.makeCancellable(game.functions.getCurrentAuctionIndex(Team.blue))
        .map((index) => setAuctionIndex(Team.blue, index))
        .mapError(logNotCancelledError(`Failed to get auction for blue team`)),
      // Get results
      CancellablePromise.makeCancellable(getAllResultsForTeam(game, Team.red))
        .map(results => setAuctionResults(Team.red, updateAuctionResults(auctionResults[Team.red], results)))
        .mapError(logNotCancelledError('Failed to get auction results for red team')),
      CancellablePromise.makeCancellable(getAllResultsForTeam(game, Team.blue))
        .map(results => setAuctionResults(Team.blue, updateAuctionResults(auctionResults[Team.blue], results)))
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

      setLeadingBid(team, { bidder, amount, move });
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
      const auctionMove: AuctionMove = {
        move,
        result: hit ? AuctionResult.hit : AuctionResult.miss,
        index: auctionIndex,
      };
      console.log(`[EVENT] MoveConfirmed, ${JSON.stringify(auctionMove)}`);
      setAuctionResults(team, updateAuctionResults(auctionResults[team], [auctionMove]));
    },
  );

  useEventListener(
    game,
    'AuctionCreated',
    (team: Team, auctionIndex: number) => {
      console.log(`[EVENT] AuctionCreated ${Team[team]} ${auctionIndex}`);
      // Auction cannot be found sometimes without this timeout
      setTimeout(() => setAuctionIndex(team, auctionIndex), 200);
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

  return {
    contractAddress,
    error,
    loading,
    fieldSize,
    currentAuctionIndexes,
    auctionResults,
    leadingBids,
    result,
  };
}

const Game = createContainer(useGame);

export default Game;
