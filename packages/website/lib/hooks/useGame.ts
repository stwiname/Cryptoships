import { useState, useEffect } from 'react';
import { Game as GameInstance } from 'contracts/types/ethers-contracts/Game';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { useWeb3React } from '@web3-react/core';

const useGame = (contractAddress: string): GameInstance => {
  const context = useWeb3React();

  const [gameInstance, setGameInstance] = useState<GameInstance>(null);

  useEffect(() => {
    const game = GameFactory.connect(
      contractAddress,
      context.library.getSigner(context.account)
    );
    setGameInstance(game);

  }, [contractAddress]);

  return gameInstance;
}

export default useGame;