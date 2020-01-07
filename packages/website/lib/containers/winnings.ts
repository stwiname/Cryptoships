import { utils } from 'ethers';
import { createContainer } from 'unstated-next';
import { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Team } from '../contracts';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import useGame from '../hooks/useGame';
import useEventListener from '../hooks/useEventListener';

function useWinnings(contractAddress: string) {
  const context = useWeb3React();
  const game = useGame(contractAddress);

  const [redWinnings, setRedWinnings] = useState<string>('0');
  const [blueWinnings, setBlueWinnings] = useState<string>('0');

  const getWinnings = () => {
    if (!game) {
      return;
    }

    game.functions.getPotentialWinnings(context.account, Team.red)
      .then(amountBN => setRedWinnings(amountBN.toString()))
      .catch(e => console.log('Failed to get potential winnings', e));

    game.functions.getPotentialWinnings(context.account, Team.blue)
      .then(amountBN => setBlueWinnings(amountBN.toString()))
      .catch(e => console.log('Failed to get potential winnings', e));
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
    withdrawWinnings,
  }
}

const Winnings = createContainer(useWinnings);

export default Winnings;
