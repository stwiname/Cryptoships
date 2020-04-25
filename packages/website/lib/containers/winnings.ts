import { utils } from 'ethers';
import { createContainer } from 'unstated-next';
import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Team, GameResult } from '../contracts';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import useContract from '../hooks/useContract';
import useEventListener from '../hooks/useEventListener';
import CancellablePromise, { PromiseCancelledError, logNotCancelledError } from '../cancellablePromise';

function useWinnings(contractAddress: string) {
  const context = useWeb3React();
  const game = useContract(contractAddress, GameFactory.connect);

  const [winningTeam, setWinningTeam] = useState<Team>(null);
  const [redWinnings, setRedWinnings] = useState<utils.BigNumber>(new utils.BigNumber('0'));
  const [blueWinnings, setBlueWinnings] = useState<utils.BigNumber>(new utils.BigNumber('0'));

  const getWinnings = () => {
    if (!game) {
      return;
    }

    if (!context.account || context.account === '#0') {
      return;
    }

    return CancellablePromise.all([
      CancellablePromise.makeCancellable(game.functions.getPotentialWinnings(context.account, Team.red))
        .map(setRedWinnings)
        .mapError(logNotCancelledError('Failed to get red potential winnings')),
      CancellablePromise.makeCancellable(game.functions.getPotentialWinnings(context.account, Team.blue))
        .map(setBlueWinnings)
        .mapError(logNotCancelledError('Failed to get blue potential winnings')),
      CancellablePromise.makeCancellable(game.functions.getResult())
        .map(result => {
          if (GameResult[result] === GameResult[GameResult.blueWinner] ||
            GameResult[result] === GameResult[GameResult.redWinner])
          {
            setWinningTeam(
              GameResult[result] === GameResult[GameResult.blueWinner]
                ? Team.blue
                : Team.red
            );
          }
        })
        .mapError(logNotCancelledError('Failed to get game result')),
    ]);
  }

  useEffect(() => {
    const tasks = getWinnings();

    return tasks?.cancel;
  }, [game, context.account]);

  useEventListener(
    'HighestBidPlaced',
    () => getWinnings(),
    game
  );

  const withdrawWinnings = () => {
    if (!game) {
      throw new Error('No game found');
    }

    return game.functions.withdraw();
  }

  return {
    redWinnings,
    blueWinnings,
    winningTeam,
    withdrawWinnings,
  }
}

const Winnings = createContainer(useWinnings);

export default Winnings;
