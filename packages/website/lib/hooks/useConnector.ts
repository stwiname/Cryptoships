import { useEffect, } from 'react';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
const connectorKey = '@cryptoships/connectors';

export default function useConnector() {

  const context = useWeb3React();

  const activateNetwork = () => {
    return context.activate(connectors.Network);
  }

  const activateMetamask = async () => {
    if (!(window as any).ethereum) {
      return window.open('https://metamask.io', '_blank');
    }
    await context.activate(
      connectors.MetaMask,
      activateNetwork,
    );

    window.localStorage.setItem(connectorKey, 'metamask');
  }

  const activateSaved = async () => {
    await activateNetwork();

    if (!context.active) {
      const usedConnector = window.localStorage.getItem(connectorKey);
      switch (usedConnector) {
        case "metamask":
          await activateMetamask();
          break;
        default:
          // activateDefault();
          break;
      }
    }
  }

  return {
    activateNetwork,
    activateMetamask,
    activateSaved
  }
}
