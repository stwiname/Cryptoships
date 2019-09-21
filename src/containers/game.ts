import { useState, useEffect } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3Context } from 'web3-react';
import { GameFactory } from '../../types/ethers-contracts/GameFactory';
import { Game as GameInstance } from '../../types/ethers-contracts/Game';
import { Team, AuctionResult } from '../../lib/contracts';
import { utils } from 'ethers';

type AuctionMove = {
  move: [number, number],
  result: AuctionResult;
}

const formatAuctionResults = ({ 0: moves, 1: results }: {
    0: ((number)[])[];
    1: (number)[];
  }): AuctionMove[] => {
  return moves.map((move, index) => ({
      move: move as [number, number],
      result: results[index] as AuctionResult
  }));
}

function useGame(contractAddress: string) {
  const context = useWeb3Context();

  if (!context.active || context.error) {
    throw new Error('Web3 context not setup!!');
  }

  if (!contractAddress) {
    return null;
  }

  const [fieldSize, setFieldSize] = useState<number>(0);
  const [gameInstance, setGameInstance] = useState<GameInstance>(null);
  const [redAuctionAddress, setRedAuctionAddress] = useState<string>(null);
  const [blueAuctionAddress, setBlueAuctionAddress] = useState<string>(null);
  const [redAuctionResults, setRedAuctionResults] = useState<AuctionMove[]>([]);
  const [blueAuctionResults, setBlueAuctionResults] = useState<AuctionMove[]>([]);

  useEffect(() => {
    const game = GameFactory.connect(contractAddress, context.library.getSigner(context.account));
    setGameInstance(game);

    game.functions.fieldSize()
      .then(sizeBN => setFieldSize(sizeBN.toNumber()));

    game.functions.getCurrentAuction(Team.red)
      .then(setRedAuctionAddress);

    game.functions.getCurrentAuction(Team.blue)
      .then(setBlueAuctionAddress);

    game.functions.getAllAuctionResults(Team.red)
      .then(formatAuctionResults)
      .then(setRedAuctionResults)
      .catch(e => console.log('Failed to get auction results for red team'));

    game.functions.getAllAuctionResults(Team.blue)
      .then(formatAuctionResults)
      .then(setBlueAuctionResults)
      .catch(e => console.log('Failed to get auction results for blue team'));
  }, [contractAddress]);


  const placeBid = async (team: Team, position: { x: number, y: number }, value: utils.BigNumber) => {
    if (!gameInstance) {
      throw new Error('No game found');
    }

    return gameInstance.functions.placeBid(team, [position.x, position.y], { value });
  }

  return {
    fieldSize,
    redAuctionAddress,
    blueAuctionAddress,
    redAuctionResults,
    blueAuctionResults,
    placeBid,
  };
}

const Game = createContainer(useGame);

export default Game;