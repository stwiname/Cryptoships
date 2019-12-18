#!/usr/bin/env node

import * as ethers from 'ethers';
import { sum } from 'ramda';
import Web3 from 'web3';
import yargs from 'yargs';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { Team } from './contracts';
import { computeFieldHash, generateBattlefield, SHIPS } from './generator';
import Oracle from './oracle';
import State from './state';
import { IStorage, MemoryStorage, FileStorage } from './storage';

const { abi: gameAbi } = require('contracts/build/contracts/Game.json');

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
  .option('store', {
    description: 'storage for game secrets to use [memory, file]',
    type: 'string',
    default: 'memory',
  })
  .strict(true);

// Have to go through web 3 to get websocket support
const provider = argv.web3Endpoint
  ? new ethers.providers.Web3Provider(
      (new Web3(argv.web3Endpoint).currentProvider as any)
    )
  : ethers.getDefaultProvider(argv.network);

const wallet = new ethers.Wallet(argv.secretKey, provider);

function getStorage(): IStorage {
  switch (argv.store) {
    case 'memory':
      console.log('Using memory storage');
      return new MemoryStorage();
    case 'file':
      // TODO parse arg
      console.log('Using file storage');
      return new FileStorage(process.cwd());
    default:
      throw new Error('Unsupported storage');
  }
}

async function getOrInitGame(signer: ethers.Signer) {
  const storage = getStorage();
  if (argv.gameAddress) {
    const gameState = await storage.getGame(argv.gameAddress);

    if (!gameState) {
      throw new Error('Game state not found')
    }
    return {
      gameInstance: GameFactory.connect(argv.gameAddress, signer),
      state: new State({
        [Team.red]: gameState[Team.red].field,
        [Team.blue]: gameState[Team.blue].field,
      }),
    };
  }

  const state = State.generate(argv.fieldSize);
  const factory = new GameFactory(signer);

  const salt = new Date().getTime().toString();

  const gameInstance = await factory.deploy(
    state.getFieldHashForTeam(Team.red),
    state.getFieldHashForTeam(Team.blue),
    argv.fieldSize,
    sum(SHIPS),
    60, // 300s, 5min
    Team.red
  );

  storage.setGame(gameInstance.address, {
    [Team.red]: {
      field: state.battleFields[Team.red],
      salt
    },
    [Team.blue]: {
      field: state.battleFields[Team.blue],
      salt
    }
  })

  console.log('Game successfully deployed to', gameInstance.address);

  return {
    gameInstance,
    state,
  };
}

getOrInitGame(wallet).then(({ gameInstance, state }) => {
  return new Oracle(gameInstance, state);
});
