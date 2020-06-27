import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

const INFURA_API_KEY = '633ec828fb0a4a0386f04382ab25f394';

const urls = {
  1: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  3: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
  1337: `http://localhost:8545`
};

const MetaMask = new InjectedConnector({
  supportedChainIds: [1, 3, 1337, 5777],
});

const Network = new NetworkConnector({
  urls,
  defaultChainId: process.env.NODE_ENV === 'development' ? 1 : 1,
});

const WalletConnect = new WalletConnectConnector({
  rpc: { 1: urls[1] },
});

export default {
  MetaMask,
  Network,
  WalletConnect,
};
