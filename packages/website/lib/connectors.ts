import { Connectors } from 'web3-react';
const { InjectedConnector, NetworkOnlyConnector } = Connectors;

const MetaMask = new InjectedConnector({
  supportedNetworks: [1, 4, 5777, 1569227158123],
});

const Infura = new NetworkOnlyConnector({
  providerURL: 'ws://localhost:8545' /*'wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID'*/,
});

export default {
  MetaMask,
  Infura,
};
