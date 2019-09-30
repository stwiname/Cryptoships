## Development

### Setup

1. Setup local development blockchain
    1. Install [truffle](https://github.com/trufflesuite/truffle): `npm i -g truffle`
    1. Run truffle: `truffle develop`
1. Compile code
    1. `npm run start`. This will watch for changes and recompile, serve up the website
1. Run the Oracle
    1. Get one of the secret/private keys from `truffle develop` output
    1. Run `node ./lib/index.js --secretKey <secret-key> --web3Endpoint ws://localhost:8545` to create a game. This will use a random field. The `web3Endpoint` is logged by `truffle develop`
    1. You can run the oracle again for the same address by adding `--gameAddress <Address>` this will use hard coded fields
1. Setup metamask
    1. Import one of the private keys from `truffle develop`
    1. Chose the localhost 8545 network
    1. You should see 100Eth in your account if it works
1. Load the website at http://localhost:8000

