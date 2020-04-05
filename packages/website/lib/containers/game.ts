import { utils } from 'ethers';
import append from 'ramda/src/append';
import range from 'ramda/src/range';
import uniqBy from 'ramda/src/uniqBy';
import concat from 'ramda/src/concat';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3React } from '@web3-react/core';
import { AuctionFactory } from 'contracts/types/ethers-contracts/AuctionFactory';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { Game as GameInstance } from 'contracts/types/ethers-contracts/Game';
import { LeadingBid, AuctionResult, Team, GameResult } from '../contracts';
import useEventListener from '../hooks/useEventListener';
import useContract from '../hooks/useContract';
import { useHistory } from "react-router-dom";

export type AuctionMove = {
  move: number[];
  result: AuctionResult;
  address: string; // Auction address
};

function useGame(contractAddress: string) {
  const context = useWeb3React();
  const game = useContract(contractAddress, GameFactory.connect);
  const history = useHistory();

  if (!context.active || context.error) {
    throw new Error('Web3 context not setup!!');
  }

  if (!contractAddress) {
    return null;
  }

  const [fieldSize, setFieldSize] = useState<number>(0);
  const [result, setResult] = useState<GameResult>(GameResult.unset);
  const [redAuctionAddress, setRedAuctionAddress] = useState<string>(null);
  const [blueAuctionAddress, setBlueAuctionAddress] = useState<string>(null);
  const [redAuctionResults, setRedAuctionResults] = useState<AuctionMove[]>([]);
  const [blueAuctionResults, setBlueAuctionResults] = useState<AuctionMove[]>(
    []
  );
  const [redLeadingBid, setRedLeadingBid] = useState<LeadingBid>(null);
  const [blueLeadingBid, setBlueLeadingBid] = useState<LeadingBid>(null);

  const updateAuctionResults = (existing: AuctionMove[], newMoves: AuctionMove[]) => 
    uniqBy<AuctionMove, number[]>(a => a.move, concat(existing, newMoves))


  const clearState = () => {
    setFieldSize(0);
    setResult(GameResult.unset);
    setRedAuctionAddress(null);
    setBlueAuctionAddress(null);
    setRedAuctionResults([]);
    setBlueAuctionResults([]);
    setRedLeadingBid(null);
    setBlueLeadingBid(null);
  }

  useEffect(() => {
    clearState();
  }, [contractAddress])

  useEffect(() => {
    if (!game) {
      // Reset all values
      clearState();
      return;
    }

    game.functions
      .getFieldSize()
      .then(sizeBN => setFieldSize(sizeBN))
      .catch((e: Error) => {
        console.log('Failed to get field size', e);
        // history.push('/not-found');
      });
    // TODO find way to throw this error

    game.functions
      .getCurrentAuction(Team.red)
      .then(setRedAuctionAddress)
      .catch(e => console.log(`Failed to get auction for red team`));

    game.functions
      .getCurrentAuction(Team.blue)
      .then(setBlueAuctionAddress)
      .catch(e => console.log(`Failed to get auction for blue team`));

    game.functions.getResult()
      .then(result => setResult(result))
      .catch(e => console.log(`Failed to get game result`, e));

    getAllResultsForTeam(game, Team.red)
      .then(results => setRedAuctionResults(updateAuctionResults(redAuctionResults, results)))
      .catch(e => console.log('Failed to get auction results for red team', e));

    getAllResultsForTeam(game, Team.blue)
      .then(results => setBlueAuctionResults(updateAuctionResults(blueAuctionResults, results)))
      .catch(e =>
        console.log('Failed to get auction results for blue team', e)
      );

    // throw new Error('test');
    // TODO get leading bid for each team
  }, [game]);

  useEventListener(
    'HighestBidPlaced',
    (
      team: Team,
      bidder: string,
      amount: utils.BigNumber,
      move: [number, number],
      endTime: utils.BigNumber
    ) => {
      console.log('Highest bid placed', Team[team]);
      const setLeadingBid =
        Team[team] === Team[Team.red] ? setRedLeadingBid : setBlueLeadingBid;

      setLeadingBid({ bidder, amount, move });
    },
    game
  );

  useEventListener(
    'MoveConfirmed',
    (
      team: Team,
      hit: boolean,
      move: [number, number],
      auctionAddress: string
    ) => {
      const setAuctionResults =
        Team[team] === Team[Team.red]
          ? setRedAuctionResults
          : setBlueAuctionResults;
      const auctionResults = getTeamAuctionResults(team);
      const auctionMove: AuctionMove = {
        move,
        result: hit ? AuctionResult.hit : AuctionResult.miss,
        address: auctionAddress,
      };
      console.log(`Move confirmed, ${auctionMove}`);
      setAuctionResults(updateAuctionResults(auctionResults, [auctionMove]));
    },
    game
  );

  useEventListener(
    'AuctionCreated',
    (team: Team, newAuctionAddress: string) => {
      const setAuctionAddress =
        Team[team] === Team[Team.red]
          ? setRedAuctionAddress
          : setBlueAuctionAddress;
      console.log(`Auction created ${Team[team]} ${newAuctionAddress}`);
      setAuctionAddress(newAuctionAddress);
    },
    game
  );

  useEventListener(
    'GameCompleted',
    (winningTeam: Team) => {
      console.log(`Game won by ${Team[winningTeam]}`);

      // TODO set result of final move
      setResult(
        Team[winningTeam] === Team[Team.red]
          ? GameResult.redWinner
          : GameResult.blueWinner
      );
    },
    game
  );

  const getAllResultsForTeam = async (
    game: GameInstance,
    team: Team
  ): Promise<AuctionMove[]> => {
    const auctionsCount = await game.functions.getAuctionsCount(team);

    const auctionAddresses = await Promise.all(
      range(0, auctionsCount).map(n =>
        game.functions.getAuctionByIndex(team, n)
      )
    );

    const results = await Promise.all(
      auctionAddresses.map(async address => {
        const auction = AuctionFactory.connect(
          address,
          context.library
        );

        const [move, result] = await Promise.all([
          auction.functions.getLeadingMove(),
          auction.functions.getResult(),
        ]);

        return { move, result: result as AuctionResult, address };
      })
    );

    // Filter out unset (current) auctions
    return results.filter(res => res.result !== AuctionResult.unset);
  };

  const getTeamAuctionAddress = (team: Team) =>
    Team[team] === Team[Team.red] ? redAuctionAddress : blueAuctionAddress;

  const getTeamAuctionResults = (team: Team) =>
    Team[team] === Team[Team.red] ? redAuctionResults : blueAuctionResults;

  const getTeamLeadingBid = (team: Team) =>
    Team[team] === Team[Team.red] ? redLeadingBid : blueLeadingBid;

  return {
    fieldSize,
    getTeamAuctionAddress,
    getTeamAuctionResults,
    getTeamLeadingBid,
    result
  };
}

const Game = createContainer(useGame);

export default Game;
