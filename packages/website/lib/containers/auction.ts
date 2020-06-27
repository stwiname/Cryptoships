import { useEffect, useState, useRef, useMemo } from 'react';
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
  const { contractAddress: gameAddress, currentAuctionIndexes } = GameContainer.useContainer();
  const game = useContract(gameAddress, GameFactory.connect);

  const index = useMemo(
    () => auctionIndex ?? currentAuctionIndexes[team],
    [auctionIndex, currentAuctionIndexes[team], team]
  );
  const fetchTask = useRef<CancellablePromise<void>>(null);

  const [auction, setAuction] = useState<Auction>(null);
  const [pendingBid, setPendingBid] = useState<AuctionMove>(null);
  const pendingBidRef = useRef<AuctionMove>(null); // Need ref as well because we need immediate state change

  useEffect(() => {
    if (!game || index === null || index === undefined) {
      console.log('Not fetcing auction', gameAddress, !!game, index, team);
      return;
    }
    console.log('Fetching auction');
    fetchTask.current = fetchAuction();

    return fetchTask.current?.cancel;

  }, [team, index, game]);

  useEffect(() => {
    setPendingBid(null);
  }, [context.account]);

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
      console.log('[EVENT] Auction HighestBidPlaced');
      if (team === t && auctionIndex === index) {
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
      console.log('[EVENT] Auction MoveConfirmed');
      if (team === t && auctionIndex === index) {
        fetchTask.current = fetchAuction();
      }
    }
  );

  const fetchAuction = () => {
    if (team === undefined || team === null ||
        index === undefined || index === null
    ) {
      return null;;
    }
    return CancellablePromise.makeCancellable(game?.getAuctionByIndex(team, index))
      .map(async (a) => {
        console.log('Fetch auction', !!game, team, index, a);

        // Sometimes the result has empty values, we retry again, hopefully with the latest state
        if (a.startTime.isZero()) {
          console.log('Retrying fetch auction', index);
          await new Promise(resolve => setTimeout(resolve, 500));
          fetchAuction();
          return;
        }
        return a;
      })
      .map((a) => a && setAuction(a))
      .mapError(logNotCancelledError(`Failed to get auction by index`));
  }

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
    if (index === undefined || index === null) {
      throw new Error('No game found');
    }

    let tx: ContractTransaction;

    try {
      console.log('Place bid', position, value.toString());

      const estimate = await (game.estimate.placeBid as any)([position.x, position.y], team, index, {
        value,
      }).catch((e: Error) => 0);

      tx = await game.placeBid([position.x, position.y], team, index, {
        value,
        gasLimit: Math.max(600000, estimate) // Set this to fix out of gas errors
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
    index,
    team,
    auction,
    hasStarted,
    hasEnded,
    placeBid,
    pendingBid,
  };
}

const createAuctionContainer = () => createContainer(useAuction);

export default createAuctionContainer;
