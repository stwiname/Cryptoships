import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';

const MetaMask = new InjectedConnector({
  supportedChainIds: [1, 3, 1337, 5777],
});

const Infura = new NetworkConnector({
  urls: [
    process.env.NODE_ENV === 'development'
      ? 'ws://localhost:8545'
      : 'https://mainnet.infura.io/v3/633ec828fb0a4a0386f04382ab25f394'
      // : 'wss://mainnet.infura.io/ws/v3/633ec828fb0a4a0386f04382ab25f394'
    ],
});

export default {
  MetaMask,
  Infura,
};
