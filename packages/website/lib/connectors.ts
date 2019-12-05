import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';

const MetaMask = new InjectedConnector({
  supportedChainIds: [1, 4, 1337, 5777],
});

const Infura = new NetworkConnector({
  urls: ['ws://localhost:8545'] /*'wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID'*/,
});

export default {
  MetaMask,
  Infura,
};
