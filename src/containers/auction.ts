import { useState, useEffect } from 'react';
import { createContainer } from 'unstated-next';
import { useWeb3Context } from 'web3-react';
import { Team } from '../../lib/contracts';
import { AuctionFactory } from '../../types/ethers-contracts/AuctionFactory';
import { Auction as AuctionInstance } from '../../types/ethers-contracts/Auction';
import GameContainer from './game';

function useAuction(team: Team) {
  const context = useWeb3Context();
  const game = GameContainer.useContainer();

  const auctionAddress = game.getTeamAuctionAddress(team);
  const gameLeadingBid = game.getTeamLeadingBid(team);

  const [auctionInstance, setAuctionInstance] = useState<AuctionInstance>(null);
  const [leadingBid, setLeadingBid] = useState(null);
  const [startTime, setStartTime] = useState<Date>(null);
  const [endTime, setEndTime] = useState<Date>(null);
  const [, updateState] = useState(); // Used to force a rerender

  useEffect(() => {
    if (auctionAddress) {
      const auction = AuctionFactory.connect(auctionAddress, context.library.getSigner(context.account));
      setAuctionInstance(auction);

      auction.functions.getLeadingBid()
        .then(setLeadingBid);

      getStartTime(auction);
      getEndTime(auction);
    }
  }, [auctionAddress]);

  useEffect(() => {
    let timer: number = null;
    if (startTime) {
      timer = setTimeout(
        () => updateState({}),
        startTime.getTime() - Date.now()
      );
    }
    return () => clearTimeout(timer);
  }, [startTime]);

  useEffect(() => {
    let timer: number = null;
    if (endTime) {
      timer = setTimeout(
        () => updateState({}),
        endTime.getTime() - Date.now()
      );
    }
    return () => clearTimeout(timer);
  }, [endTime]);

  const getStartTime = (auction: AuctionInstance) => {
    auction.functions.startTime()
        .then(startBN => setStartTime(new Date(startBN.toNumber() * 1000)));
  }

  const getEndTime = (auction: AuctionInstance) => {
    auction.functions.getEndTime()
        .then((endBN) => {
          !endBN.isZero() && setEndTime(new Date(endBN.toNumber() * 1000))
        });
  }

  useEffect(() => {
    console.log('useAuction, leading bid');
    setLeadingBid(gameLeadingBid);

    if (!startTime && auctionInstance) {
      getStartTime(auctionInstance);
    }

    if (!endTime && auctionInstance) {
      getEndTime(auctionInstance);
    }
  }, [gameLeadingBid]);

  return {
    auctionAddress,
    team,
    leadingBid,
    startTime,
    endTime,
  }
}


const createAuctionContainer = () => createContainer(useAuction);

export default createAuctionContainer;