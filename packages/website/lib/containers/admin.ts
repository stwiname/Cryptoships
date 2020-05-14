import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useContract } from '../hooks';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { useWeb3React } from '@web3-react/core';
import { utils, providers } from 'ethers';
import CancellablePromise, { PromiseCancelledError, logNotCancelledError } from '../cancellablePromise';

function useAdmin(contractAddress: string) {
  const web3 = useWeb3React();
  const game = useContract(contractAddress, GameFactory.connect);

  const [isAdmin, setAdmin] = useState<boolean>(false);
  const [withdrawDeadline, setWithdrawDeadline] = useState<utils.BigNumber>(null);
  const [balance, setBalance] = useState<utils.BigNumber>(null);

  useEffect(() => {

    if (!game) {
      setWithdrawDeadline(null);
      setBalance(null);
      return;
    }

    const tasks = CancellablePromise.all([
      CancellablePromise.makeCancellable(game.getWithdrawDeadline())
        .map(setWithdrawDeadline),
      CancellablePromise.makeCancellable(web3.library?.getBalance(contractAddress))
        .map(setBalance),
    ]);

    return tasks.cancel;
  }, [game]);

  useEffect(() => {

    if (!game || !web3.account) {
      setAdmin(false);
      return;
    }

    const task = CancellablePromise.makeCancellable(game.owner())
      .map(owner => setAdmin(owner === web3.account));

    return task.cancel;
  }, [web3.account, game]);

  const claim = async () => {
    const tx = await game.withdrawRemainder(web3.account);


    return tx;
  }

  return {
    isAdmin,
    withdrawDeadline,
    balance,
    claim,
  }
}

const Admin = createContainer(useAdmin);

export default Admin;
