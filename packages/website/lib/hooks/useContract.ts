import { useState, useEffect, useRef } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract, Signer } from 'ethers';

const useContract = <C extends Contract>(contractAddress: string, factory: (address: string, signer: Signer) => C): C => {
  const context = useWeb3React();

  const contractInstance = useRef<C>(null);

  useEffect(() => {

    if (!contractAddress) {
      contractInstance.current = null;
      return;
    }

    const signerOrProvider = context.account
      ? context.library.getSigner(context.account)
      : context.library;

    const contract = factory(
      contractAddress,
      signerOrProvider,
    );
    contractInstance.current = contract;

  }, [contractAddress, context.connector, context.chainId]);

  return contractInstance.current;
}

export default useContract;
