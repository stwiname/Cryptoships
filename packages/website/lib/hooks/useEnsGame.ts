import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { createContainer } from 'unstated-next';

export default function useEnsGame() {
  const [gameAddress, setGameAddress] = useState<string>(null);
  const context = useWeb3React();

  useEffect(() => {

    if (!context.library) {
      return;
    }

    context.library.resolveName('game.cryptoships.eth')
      .then((address: string) => {
        console.log('game.cryptoships.eth result', address);
        setGameAddress(address);
      })
      .catch((e: Error) => {
        console.log('Failed to resolve address for `game.cryptoships.eth`', e);
        setGameAddress(null);
      });
  }, [context.chainId]);

  return gameAddress;
}

