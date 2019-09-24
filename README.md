## Development

### Setup

1. Setup local development blockchain
  1. Install [ganache-cli](https://github.com/trufflesuite/ganache-cli): `npm i -g ganache-cli`
  1. Run ganache: `ganache-cli`
1. Compile code
  1. `npm run start`. This will watch for changes and recompile, serve up the website
1. Run the Oracle
  1. Get one of the secret/private keys from `ganache-cli` output
  1. Run `node ./lib/index.js --secretKey <secret-key> --web3Endpoint ws://localhost:8545` to create a game. This will use a random field. The `web3Endpoint` is logged by `ganache-cli`
  1. You can run the oracle again for the same address by adding `--gameAddress <Address>` this will use hard coded fields
1. Setup metamask
  1. Import one of the private keys from `ganache-cli`
  1. Add the ganache network to metamask
  1. You should see 100Eth in your account if it works
1. Load the website at http://localhost:8000

