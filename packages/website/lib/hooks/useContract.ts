import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract, Signer } from 'ethers';

const useContract = <C extends Contract>(contractAddress: string, factory: (address: string, signer: Signer) => C): C => {
  const context = useWeb3React();

  const [contractInstance, setContractInstance] = useState<C>(null);

  useEffect(() => {

    if (!contractAddress) {
      setContractInstance(null);
      return;
    }

    const signerOrProvider = context.account
      ? context.library.getSigner(context.account)
      : context.library;

    const contract = factory(
      contractAddress,
      signerOrProvider,
    );
    setContractInstance(contract);

  }, [contractAddress, context.account, context.chainId]);

  return contractInstance;
}

export default useContract;