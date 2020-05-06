import { useEffect, useState, useRef } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3React } from '@web3-react/core';
import { LeadingBid, Team, AuctionResult, Auction } from '../contracts';
import { GameFactory } from 'contracts/types/ethers-contracts/GameFactory';
import useContract from '../hooks/useContract';
import GameContainer, { AuctionMove } from './game';
import { utils, ContractTransaction } from 'ethers';
import CancellablePromise, { PromiseCancelledError, logNotCancelledError } from '../cancellablePromise';
import { movesEqual, bnToDate, isBnDateAfterNow } from '../utils';
import { useEventListener } from '../hooks';

function useAuction({ team, index: auctionIndex }: { team: Team; index?: number }) {
  const context = useWeb3React();
  const { contractAddress: gameAddress, getCurrentAuctionIndex } = GameContainer.useContainer();
  const game = useContract(gameAddress, GameFactory.connect);

  const getIndex = () => auctionIndex ?? getCurrentAuctionIndex(team);
  const fetchTask = useRef<CancellablePromise<void>>(null);

  const [auction, setAuction] = useState<Auction>(null);

  useEffect(() => {
    const index = getIndex();
    if (index === null || index === undefined) {
      return;
    }
    fetchTask.current = fetchAuction();

    return fetchTask.current?.cancel;

  }, [team, getIndex(), game]);

  useEventListener(
    game,
    'HighestBidPlaced',
    (
      t: Team,
      bidder: string,
      amount: utils.BigNumber,
      move: [number, number],
      endTime: utils.BigNumber,
      auctionIndex: number,
    ) => {

      if (team === t && auctionIndex === getIndex()) {
        fetchTask.current = fetchAuction();
      }
    },
  );

  useEventListener(
    game,
    'MoveConfirmed',
    (
      t: Team,
      hit: boolean,
      move: [number, number],
      auctionIndex: number,
    ) => {
      if (team === t && auctionIndex === getIndex()) {
        fetchTask.current = fetchAuction();
      }
    }
  );

  const fetchAuction = () => {
    const index = getIndex();
    if (team === undefined || team === null ||
        index === undefined || index === null
    ) {
      return null;;
    }
    return CancellablePromise.makeCancellable(game?.getAuctionByIndex(team, index))
      .map((a) => {
        console.log('Fetch auction', a);
        return a;
      })
      .map(setAuction)
      .mapError(logNotCancelledError(`Failed to get auction by index`));
  }

  const [pendingBid, setPendingBid] = useState<AuctionMove>(null);
  const pendingBidRef = useRef<AuctionMove>(null); // Need ref as well because we need immediate state change

  const hasStarted = () => {
    if (auction?.startTime.isZero()) {
      return false;
    }
    return !isBnDateAfterNow(auction?.startTime);
  }

  const hasEnded = () => {
    if (auction?.endTime.isZero()) {
      return false;
    }
    return !isBnDateAfterNow(auction?.endTime);
  }

  const placeBid = async (
    position: { x: number; y: number },
    value: utils.BigNumber
  ) => {
    const index = getIndex();
    if (index === undefined || index === null) {
      throw new Error('No game found');
    }

    let tx: ContractTransaction;

    try {
      console.log('Place bid', position, value.toString());
      tx = await game.placeBid([position.x, position.y], team, index, {
        value,
        // gasLimit: 200000
      });

      const bid = {
        move: [position.x, position.y],
        index,
        result: AuctionResult.unset
      };

      // Set bid as pending once tx submitted
      setPendingBid(bid);
      pendingBidRef.current = bid;

      tx.wait(1)
        .finally(() => {
          // After 1 block we know the TX has happend and is no longer pending
          // Another move could have been made so we check they are the same position
          if (movesEqual(pendingBidRef?.current?.move, [position.x, position.y])) {
            setPendingBid(null);
          }
        });
    }
    catch(e) {
      console.log('Failed to place bid', e);
      setPendingBid(null);
    }

    return tx;
  };

  return {
    index: getIndex(),
    team,
    auction,
    hasStarted,
    hasEnded,
    placeBid,
    pendingBid,
    // result,
  };
}

const createAuctionContainer = () => createContainer(useAuction);

export default createAuctionContainer;
