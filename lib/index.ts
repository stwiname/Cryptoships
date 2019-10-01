#!/usr/bin/env node

import * as ethers from 'ethers';
import { sum } from 'ramda';
import Web3 from 'web3';
import yargs from 'yargs';
import { GameFactory } from '../types/ethers-contracts/GameFactory';
import { Team } from './contracts';
import { generateBattlefield, SHIPS } from './generator';
import Oracle from './oracle';
import State from './state';

const { abi: gameAbi } = require('../build/contracts/Game.json');

const { argv } = yargs
  .option('secretKey', {
    description: 'secretKey for the account used to deploy the game',
    demandOption: true,
    type: 'string',
  })
  .option('gameAddress', {
    description: 'a contract address to an existing game',
    type: 'string',
  })
  .option('web3Endpoint', {
    description: 'endpoint for web3 gateway (overwrites network usage)',
    type: 'string',
  })
  .option('network', {
    description: 'ethers.js network names',
    default: 'homestead', // Ethers default
  })
  .option('fieldSize', {
    description: 'fieldSize to be used for new games',
    default: 10,
  })
  .strict(true);

const provider = argv.web3Endpoint
  ? new ethers.providers.Web3Provider(
      new Web3(argv.web3Endpoint).currentProvider
    )
  : ethers.getDefaultProvider(argv.network);

const wallet = new ethers.Wallet(argv.secretKey, provider);

async function getOrInitGame(signer: ethers.Signer) {
  if (argv.gameAddress) {
    // TODO somehow need the battlefield
    return {
      gameInstance: GameFactory.connect(argv.gameAddress, signer),
      state: new State({
        [Team.red]: require('../test_field_red.json'),
        [Team.blue]: require('../test_field_blue.json'),
      }),
    };
  }

  const state = new State({
    [Team.red]: generateBattlefield(argv.fieldSize),
    [Team.blue]: generateBattlefield(argv.fieldSize),
  });
  const factory = new GameFactory(signer);

  const gameInstance = await factory.deploy(
    'test',
    argv.fieldSize,
    sum(SHIPS),
    60, // 300s, 5min
    Team.red
  );

  console.log('Game successfully deployed to', gameInstance.address);

  return {
    gameInstance,
    state,
  };
}

getOrInitGame(wallet).then(({ gameInstance, state }) => {
  return new Oracle(gameInstance, state);
});
