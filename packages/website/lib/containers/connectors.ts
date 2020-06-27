import { useEffect, useState} from 'react';
import { useWeb3React } from '@web3-react/core';
import { AbstractConnectorInterface} from '@web3-react/types'
import connectors from '../connectors';
const connectorKey = '@cryptoships/connectors';
import { createContainer } from 'unstated-next';

function useConnector() {

  const context = useWeb3React();

  const [activeConnector, setActiveConnector] = useState<AbstractConnectorInterface>(null);

  const activateNetwork = () => {
    return context.activate(connectors.Network);
  }

  const setConnector = async (connector: AbstractConnectorInterface, name: string) => {
    await context.activate(
      connector,
      activateNetwork,
    );

    window.localStorage.setItem(connectorKey, name);
    console.log("SETTING ACTIVE CONNECTOR");
    setActiveConnector(connector);
  }

  const activateMetamask = async () => {
    return setConnector(connectors.MetaMask, 'metamask');
  }

  const activateWalletConnect = async () => {
    return setConnector(connectors.WalletConnect, 'walletconnect');
  }

  const activateSaved = async () => {
    await activateNetwork();

    if (!context.active) {
      const usedConnector = window.localStorage.getItem(connectorKey);
      switch (usedConnector) {
        case "metamask":
          await activateMetamask();
          break;
        case "walletconnect":
          await activateWalletConnect();
          break;
        default:
          // activateDefault();
          break;
      }
    }
  }

  const deactivate = () => {
    window.localStorage.removeItem(connectorKey);

    // TODO once disconnecting walletconnect cannot reconnect without refresh
    // (activeConnector as any)?.close();
    activeConnector?.deactivate();

    setActiveConnector(null);

    activateNetwork();
  }

  return {
    activateNetwork,
    activateMetamask,
    activateWalletConnect,
    activateSaved,
    deactivate
  }
}

export default createContainer(useConnector);
