# Battleship

A blockchain based take on the classic battleship game

## Packages

- [Contacts](packages/contracts/) Ethereum contracts
- [Oracle](packges/oracle/) Ethreum Oracle
- [Website](packages/website/) Front end for the game


## Development

### Getting started

1. Clone the repo
1. Install dependencies with `yarn`
1. Build the source files with `yarn build`
1. Install [truffle](https://github.com/trufflesuite/truffle): `npm i -g truffle`

### Running tests

Currently only the contracts package has tests

1. Run `npx truffle develop` from `packages/contracts` directory
1. `yarn test`


### Running locally

1. Run a local ethereum blockchain in a separate terminal `truffle develop` from `packages/contracts` directory
1. Start the Oracle `node packages/oracle --secretKey <secret-key> --web3Endpoint ws://localhost:8545`
    - The secret key is one of the private keys that is logged by truffle
    - This will create a new game
1. Start serving the website `yarn start`
1. Setup metamask
    - If not installed install the metamask browser extension
    - Import one of the private keys from step one, preferably not the same one as the Oracle
1. Navigate to `http://localhost:8000/<game-address>` in your browser
    - The game address should be logged by the oracle

