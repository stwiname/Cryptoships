import { createContainer } from 'unstated-next';
import View from '../components/wallet';
import { useState, useMemo } from 'react';

const useWalletModal = () => {

  const [displayWallet, setDisplayWallet] = useState(false);

  const showWallet = () => setDisplayWallet(true);
  const hideWallet = () => setDisplayWallet(false);

  const Wallet = () => View({ open: displayWallet, onClose: hideWallet })

  return {
    displayWallet,
    showWallet,
    hideWallet,
    Wallet,
  }
}

export default createContainer(useWalletModal);
