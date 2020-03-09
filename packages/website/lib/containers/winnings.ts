import { utils } from 'ethers';
import { createContainer } from 'unstated-next';
import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Team, GameResult } from '../contracts';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import useContract from '../hooks/useContract';
import useEventListener from '../hooks/useEventListener';

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

    game.functions.getPotentialWinnings(context.account, Team.red)
      .then(amountBN => setRedWinnings(amountBN))
      .catch(e => console.log('Failed to get potential winnings', e));

    game.functions.getPotentialWinnings(context.account, Team.blue)
      .then(amountBN => setBlueWinnings(amountBN))
      .catch(e => console.log('Failed to get potential winnings', e));

    game.functions.getResult()
      .then(result => {
        if (GameResult[result] === GameResult[GameResult.blueWinner] ||
          GameResult[result] === GameResult[GameResult.redWinner])
        {
          setWinningTeam(
            GameResult[result] === GameResult[GameResult.blueWinner]
              ? Team.blue
              : Team.red
          );
        }
      });
  }

  useEffect(() => {
    getWinnings();
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
