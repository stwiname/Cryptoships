#!/usr/bin/env node

import * as ethers from 'ethers';
import { sum } from 'ramda';
import Web3 from 'web3';
import yargs from 'yargs';
import AuctionLibFactory from './AuctionLibFactory';
import { GameLibFactory } from 'contracts/types/ethers-contracts/GameLibFactory';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { Team } from './contracts';
import { computeFieldHash, generateBattlefield, SHIPS } from './generator';
import Oracle from './oracle';
import State from './state';
import { IStorage, MemoryStorage, FileStorage } from './storage';

const { abi: gameAbi } = require('contracts/build/contracts/Game.json');

yargs
  .option('web3Endpoint', {
    description: 'endpoint for web3 gateway (overwrites network usage)',
    type: 'string',
  })
  .option('network', {
    description: 'ethers.js network names',
    default: 'homestead', // Ethers default
  })
  .option('secretKey', {
    description: 'secretKey for the account used to deploy the game',
    demandOption: true,
    type: 'string',
  })
  .command('deploy', 'Deploy the library contracts', () => {}, async argv => {
    const wallet = initWallet(argv.secretKey, argv.web3Endpoint, argv.network);

    console.log('Deploying auction lib...');
    const auctionLib = await new AuctionLibFactory(wallet).deploy();
    console.log(`Deployed auction lib: ${auctionLib.address}`);
    console.log('Deploying game lib...');
    const gameLib = await new GameLibFactory(
      { __AuctionLib____________________________: auctionLib.address},
      wallet
    ).deploy();
    console.log(`Deployed game lib: ${gameLib.address}`);

    console.log(`auctionLibAddress=${auctionLib.address}\ngameLibAddress=${gameLib.address}`);

    process.exit(0);
  })
  .command('run', 'Run the game', y => {
    return y
      .option('gameLibAddress', {
        description: 'Contract address for the GameLib',
        type: 'string',
        demandOption: true,
      })
      .option('auctionLibAddress', {
        description: 'Contract address for the AuctionLib',
        type: 'string',
        demandOption: true,
      })
      .option('gameAddress', {
        description: 'a contract address to an existing game',
        type: 'string',
      })
      .option('fieldSize', {
        description: 'fieldSize to be used for new games',
        default: 10,
      })
      .option('store', {
        description: 'storage for game secrets to use [memory, file]',
        type: 'string',
        default: 'memory',
      });
    }, async argv => {
      const wallet = initWallet(argv.secretKey, argv.web3Endpoint, argv.network);
      const storage = getStorage(argv.store);

      const { gameInstance, state } = await getOrInitGame(
        wallet,
        storage,
        argv.fieldSize,
        argv.auctionLibAddress,
        argv.gameLibAddress,
        argv.gameAddress
      );

      return new Oracle(gameInstance, state);
    }
  )
  .strict(true)
  .parse();

function initWallet(secretKey: string, networkEndpoint?: string, network?: string){
  // Have to go through web 3 to get websocket support
  const provider = networkEndpoint
    ? new ethers.providers.Web3Provider(
        (new Web3(networkEndpoint).currentProvider as any)
      )
    : ethers.getDefaultProvider(network);

  return new ethers.Wallet(secretKey, provider);
}

function getStorage(store: string): IStorage {
  switch (store) {
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

async function getGame(signer: ethers.Signer, storage: IStorage, gameAddress: string) {
  const gameState = await storage.getGame(gameAddress);

  if (!gameState) {
    throw new Error('Game state not found');
  }
  return {
    gameInstance: GameFactory.connect(gameAddress, signer),
    state: new State({
      [Team.red]: gameState[Team.red].field,
      [Team.blue]: gameState[Team.blue].field,
    }),
  };
}

async function getOrInitGame(
  signer: ethers.Signer,
  storage: IStorage,
  fieldSize: number,
  auctionLibAddress: string,
  gameLibAddress: string,
  gameAddress?: string
) {
  if (gameAddress) {
    return getGame(signer, storage, gameAddress);
  }

  const state = State.generate(fieldSize);

  if (!auctionLibAddress || !gameLibAddress) {
    throw new Error('Libarary addresses must be provided');
  }
  const factory = new GameFactory({
    __GameLib_______________________________: gameLibAddress,
    __AuctionLib____________________________: auctionLibAddress,
  }, signer);

  const salt = new Date().getTime().toString();

  const gameInstance = await factory.deploy(
    state.getFieldHashForTeam(Team.red),
    state.getFieldHashForTeam(Team.blue),
    fieldSize,
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


