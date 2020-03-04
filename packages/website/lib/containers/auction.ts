import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3React } from '@web3-react/core';
import { Auction as AuctionInstance } from 'contracts/types/ethers-contracts/Auction';
import { AuctionFactory } from 'contracts/types/ethers-contracts/AuctionFactory';
import { LeadingBid, Team } from '../contracts';
import useContract from '../hooks/useContract';
import GameContainer from './game';
import { utils } from 'ethers';

function useAuction({ team, address }: { team: Team; address?: string }) {
  const context = useWeb3React();
  const game = GameContainer.useContainer();

  const auctionAddress = address || game.getTeamAuctionAddress(team);
  const gameLeadingBid = game.getTeamLeadingBid(team);

  const auction = useContract(auctionAddress, AuctionFactory.connect);

  const [leadingBid, setLeadingBid] = useState<LeadingBid>(null);
  const [startTime, setStartTime] = useState<Date>(null);
  const [endTime, setEndTime] = useState<Date>(null);
  const [duration, setDuration] = useState<number>(null);
  const [, updateState] = useState(); // Used to force a rerender

  useEffect(() => {
    if (auction) {

      auction.functions
        .getLeadingBid()
        .then(b => {
          console.log('leading bid', b);
          return { bidder: b.bidder, amount: b.amount, move: b.move };
        })
        .then(setLeadingBid);

      getStartTime(auction);
      getEndTime(auction);

      auction.functions.getDuration()
        .then(duration => {
          setDuration(duration.toNumber() * 1000);
        });
    }
  }, [auction]);

  useEffect(() => {
    let timer: number = null;
    if (startTime) {
      timer = window.setTimeout(
        () => updateState({}),
        startTime.getTime() - Date.now()
      );
    }
    return () => clearTimeout(timer);
  }, [startTime]);

  useEffect(() => {
    let timer: number = null;
    if (endTime) {
      timer = window.setTimeout(() => updateState({}), endTime.getTime() - Date.now());
    }
    return () => clearTimeout(timer);
  }, [endTime]);

  const getStartTime = (auction: AuctionInstance) => {
    auction.functions.getStartTime()
      .then(startBN => {
        console.log('AUCTION start BN', startBN.toString())
        setStartTime(new Date(startBN.toNumber() * 1000))
      })
      .catch(e => {
        console.log('Failed to get auction start time', e);
      });
  };

  const getEndTime = (auction: AuctionInstance) => {
    auction.functions.getEndTime()
      .then(endBN => {
        setEndTime(endBN.isZero() ? null : new Date(endBN.toNumber() * 1000));
      })
      .catch(e => {
        console.log('Failed to get auction end time', e);
      });
  };

  const hasStarted = () => startTime && Date.now() > startTime.getTime();
  const hasEnded = () => endTime && Date.now() > endTime.getTime();

  useEffect(() => {
    console.log('useAuction, leading bid', gameLeadingBid);
    setLeadingBid(gameLeadingBid);

    if (!startTime && auction) {
      getStartTime(auction);
    }

    if (!endTime && auction) {
      getEndTime(auction);
    }
  }, [gameLeadingBid]);

  const placeBid = async (
    position: { x: number; y: number },
    value: utils.BigNumber
  ) => {
    if (!auction) {
      throw new Error('No game found');
    }

    console.log('Place bid', position, value.toNumber());
    return auction.functions.placeBid([position.x, position.y], {
      value,
      // gasLimit: 200000
    });

    // TODO set leading bid
  };

  return {
    auctionAddress,
    team,
    leadingBid,
    startTime,
    duration,
    endTime,
    hasStarted,
    hasEnded,
    placeBid
  };
}

const createAuctionContainer = () => createContainer(useAuction);

export default createAuctionContainer;
