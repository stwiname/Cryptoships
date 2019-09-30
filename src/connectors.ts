import { Connectors } from 'web3-react';
const { InjectedConnector, NetworkOnlyConnector } = Connectors;

const MetaMask = new InjectedConnector({ supportedNetworks: [1, 4, 5777, 1569227158123] });

const Infura = new NetworkOnlyConnector({
  providerURL: 'http://localhost:8545'
});

export default {
  MetaMask,
  Infura
};