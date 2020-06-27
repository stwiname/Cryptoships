import { useState, useEffect, useRef } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract, Signer } from 'ethers';

const useContract = <C extends Contract>(contractAddress: string, factory: (address: string, signer: Signer) => C): C => {
  const context = useWeb3React();
  const [contract, setContact] = useState<C>(null);
  const signerOrProvider = useRef<Signer>(null);

  useEffect(() => {
    signerOrProvider.current = context.account
      ? context.library.getSigner(context.account)
      : context.library;
  }, [context.account, context.connector, context.chainId]);

  useEffect(() => {

    if (!contractAddress) {
      setContact(null);
      return;
    }

    if (!signerOrProvider.current) {
      return;
    }

    const contract = factory(
      contractAddress,
      signerOrProvider.current,
    );
    setContact(contract);
  }, [contractAddress, signerOrProvider]);

  return contract;
}

export default useContract;
