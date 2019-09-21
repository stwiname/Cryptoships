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

  const auctionAddress = Team[team] === Team[Team.red]
    ? game.redAuctionAddress
    : game.blueAuctionAddress;

  const [autionInstance, setAuctionInstance] = useState<AuctionInstance>(null);
  const [leadingBid, setLeadingBid] = useState(null);
  const [startTime, setStartTime] = useState<Date>(null);
  const [endTime, setEndTime] = useState<Date>(null);

  useEffect(() => {
    if (auctionAddress) {
      const auction = AuctionFactory.connect(auctionAddress, context.library.getSigner(context.account));
      setAuctionInstance(auction);

      auction.functions.getLeadingBid()
        .then(setLeadingBid);

      auction.functions.startTime()
        .then(startBN => setStartTime(new Date(startBN.toNumber() * 1000)));

      auction.functions.getEndTime()
        .then((endBN) => !endBN.isZero() && setEndTime(new Date(endBN.toNumber() * 1000)));
    }
  }, [auctionAddress]);

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