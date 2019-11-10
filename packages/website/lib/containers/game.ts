import { utils } from 'ethers';
import append from 'ramda/src/append';
import range from 'ramda/src/range';
import uniqBy from 'ramda/src/uniqBy';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3Context } from 'web3-react';
import { AuctionFactory } from 'contracts/types/ethers-contracts/AuctionFactory';
import { Game as GameInstance } from 'contracts/types/ethers-contracts/Game';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import { LeadingBid, AuctionResult, Team } from '../contracts';
import useEventListener from '../hooks/useEventListener';

type AuctionMove = {
  move: number[];
  result: AuctionResult;
  address: string; // Auction address
};

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
  const [blueAuctionResults, setBlueAuctionResults] = useState<AuctionMove[]>(
    []
  );
  const [redLeadingBid, setRedLeadingBid] = useState<LeadingBid>(null);
  const [blueLeadingBid, setBlueLeadingBid] = useState<LeadingBid>(null);

  useEffect(() => {
    const game = GameFactory.connect(
      contractAddress,
      context.library.getSigner(context.account)
    );
    setGameInstance(game);

    game.functions
      .fieldSize()
      .then(sizeBN => setFieldSize(sizeBN.toNumber()))
      .catch(e => console.log('Failed to get field size', e));
    // TODO find way to throw this error

    game.functions
      .getCurrentAuction(Team.red)
      .then(setRedAuctionAddress)
      .catch(e => console.log(`Failed to get auction for red team`));

    game.functions
      .getCurrentAuction(Team.blue)
      .then(setBlueAuctionAddress)
      .catch(e => console.log(`Failed to get auction for blue team`));

    getAllResultsForTeam(game, Team.red)
      .then(setRedAuctionResults)
      .catch(e => console.log('Failed to get auction results for red team', e));

    getAllResultsForTeam(game, Team.blue)
      .then(setBlueAuctionResults)
      .catch(e =>
        console.log('Failed to get auction results for blue team', e)
      );

    // throw new Error('test');
    // TODO get leading bid for each team
  }, [contractAddress]);

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
    gameInstance
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
      console.log('Move confirmed', auctionMove);
      setAuctionResults(
        uniqBy(a => a.move, append(auctionMove, auctionResults))
      );
    },
    gameInstance
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
    gameInstance
  );

  const getAllResultsForTeam = async (
    game: GameInstance,
    team: Team
  ): Promise<AuctionMove[]> => {
    const auctionsCount = await game.functions.getAuctionsCount(team);

    const auctionAddresses = await Promise.all(
      range(0, auctionsCount.toNumber()).map(n =>
        game.functions.getAuctionByIndex(team, n)
      )
    );

    return Promise.all(
      auctionAddresses.map(async address => {
        const auction = AuctionFactory.connect(
          address,
          context.library.getSigner(context.account)
        );

        const [move, result] = await Promise.all([
          auction.functions.getLeadingMove(),
          auction.functions.result(),
        ]);

        return { move, result: result as AuctionResult, address };
      })
    );
  };

  const placeBid = async (
    team: Team,
    position: { x: number; y: number },
    value: utils.BigNumber
  ) => {
    if (!gameInstance) {
      throw new Error('No game found');
    }

    console.log('Place bid', position, value.toNumber());
    return gameInstance.functions.placeBid(team, [position.x, position.y], {
      value,
    });

    // TODO set leading bid
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
    placeBid,
  };
}

const Game = createContainer(useGame);

export default Game;
