import { useState, useEffect } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3Context } from 'web3-react';
import { GameFactory } from '../../types/ethers-contracts/GameFactory';
import { AuctionFactory } from '../../types/ethers-contracts/AuctionFactory';
import { Game as GameInstance } from '../../types/ethers-contracts/Game';
import { Team, AuctionResult } from '../../lib/contracts';
import { utils } from 'ethers';
import { range } from 'ramda';
import useEventListener from '../hooks/useEventListener';

type AuctionMove = {
  move: number[],
  result: AuctionResult;
}

type LeadingBid = {
  bidder: string;
  amount: utils.BigNumber;
  move: number[];
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
  const [redLeadingBid, setRedLeadingBid] = useState<LeadingBid>(null);
  const [blueLeadingBid, setBlueLeadingBid] = useState<LeadingBid>(null);

  useEffect(() => {
    const game = GameFactory.connect(contractAddress, context.library.getSigner(context.account));
    setGameInstance(game);

    game.functions.fieldSize()
      .then(sizeBN => setFieldSize(sizeBN.toNumber()));

    game.functions.getCurrentAuction(Team.red)
      .then(setRedAuctionAddress);

    game.functions.getCurrentAuction(Team.blue)
      .then(setBlueAuctionAddress);

    getAllResultsForTeam(game, Team.red)
      .then(setRedAuctionResults)
      .catch(e => console.log('Failed to get auction results for red team', e));

    getAllResultsForTeam(game, Team.blue)
      .then(setBlueAuctionResults)
      .catch(e => console.log('Failed to get auction results for blue team', e));

    // TODO get leading bid for each team

    game.on('HighestBidPlaced', (team: Team, bidder: string, amount: utils.BigNumber, move: [number, number], endTime: utils.BigNumber) => {
      console.log('Highest bid placed', Team[team]);
      const setLeadingBid = Team[team] === Team[Team.red] ? setRedLeadingBid : setBlueLeadingBid;
      setLeadingBid({ bidder, amount, move });
    });

    game.on('MoveConfirmed', (team: Team, hit: boolean, move: [number, number]) => {
      const setAuctionResults = Team[team] === Team[Team.red] ? setRedAuctionResults : setBlueAuctionResults;
      const auctionResults = getTeamAuctionResults(team);
      console.log('Move confirmed', auctionResults, redAuctionResults, { move, result: hit ? AuctionResult.hit : AuctionResult.miss });

      // Why is auction results always empty?
      setAuctionResults([...auctionResults, { move, result: hit ? AuctionResult.hit : AuctionResult.miss }]);
    });

    game.on('AuctionCreated', (team: Team, newAuctionAddress: string) => {
      const setAuctionAddress = Team[team] === Team[Team.red] ? setRedAuctionAddress : setBlueAuctionAddress;
      console.log(`Auction created ${Team[team]} ${newAuctionAddress}`);
      setAuctionAddress(newAuctionAddress);
    });

    return () => {
      game.removeAllListeners('HighestBidPlaced');
      game.removeAllListeners('MoveConfimed');
      game.removeAllListeners('AuctionCreated');
    }
  }, [contractAddress]);

  // useEventListener('HighestBidPlaced', (team: Team, bidder: string, amount: utils.BigNumber, move: [number, number], endTime: utils.BigNumber) => {
  //   console.log('Highest bid placed', Team[team]);
  //   const setLeadingBid = Team[team] === Team[Team.red] ? setRedLeadingBid : setBlueLeadingBid;
  //   setLeadingBid({ bidder, amount, move });
  // }, gameInstance);

  // useEventListener('MoveConfirmed', (team: Team, hit: boolean, move: [number, number]) => {
  //   const setAuctionResults = Team[team] === Team[Team.red] ? setRedAuctionResults : setBlueAuctionResults;
  //   const auctionResults = getTeamAuctionResults(team);
  //   console.log('Move confirmed', auctionResults, redAuctionResults, { move, result: hit ? AuctionResult.hit : AuctionResult.miss });

  //   // setAuctionResults([...auctionResults, { move, result: hit ? AuctionResult.hit : AuctionResult.miss }]);
  // }, gameInstance);

  // useEventListener('AuctionCreated', (team: Team, newAuctionAddress: string) => {
  //   const setAuctionAddress = Team[team] === Team[Team.red] ? setRedAuctionAddress : setBlueAuctionAddress;
  //   console.log(`Auction created ${Team[team]} ${newAuctionAddress}`);
  //   setAuctionAddress(newAuctionAddress);
  // }, gameInstance);

  const getAllResultsForTeam = async (game: GameInstance, team: Team): Promise<AuctionMove[]> => {
    const auctionsCount = await game.functions.getAuctionsCount(team);

    const auctionAddresses = await Promise.all(
      range(0, auctionsCount.toNumber()).map(n => game.functions.getAuctionByIndex(team, n))
    );

    return Promise.all(auctionAddresses.map( async (address) => {
      const auction = AuctionFactory.connect(address, context.library.getSigner(context.account));

      const [move, result] = await Promise.all([
        auction.functions.getLeadingMove(),
        auction.functions.result()
      ]);

      return { move, result: result as AuctionResult };
    }));
  }


  const placeBid = async (team: Team, position: { x: number, y: number }, value: utils.BigNumber) => {
    if (!gameInstance) {
      throw new Error('No game found');
    }

    console.log('Place bid', position, value.toNumber());
    return gameInstance.functions.placeBid(team, [position.x, position.y], { value });
  }

  const getTeamAuctionAddress = (team: Team) => Team[team] === Team[Team.red]
    ? redAuctionAddress
    : blueAuctionAddress;

  const getTeamAuctionResults = (team: Team) => Team[team] === Team[Team.red]
    ? redAuctionResults
    : blueAuctionResults;

  const getTeamLeadingBid = (team: Team) => Team[team] === Team[Team.red]
    ? redLeadingBid
    : blueLeadingBid;

  return {
    fieldSize,
    getTeamAuctionAddress,
    getTeamAuctionResults,
    getTeamLeadingBid,
    placeBid,
  };
}

const Game = createContainer(useGame);

export default Game;