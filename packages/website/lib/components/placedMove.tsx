import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { utils } from 'ethers';
import equals from 'ramda/src/equals';
import * as React from 'react';
import { useWeb3React } from '@web3-react/core';
import { AuctionResult, MEDIA_QUERY_COND } from '../contracts';
import { createAuctionContainer } from '../containers';
import { truncateAddress } from '../utils';
import Dialog from './dialog';

const AuctionContainer = createAuctionContainer();

export type Props = {
  result?: AuctionResult;
  address?: string;
  onClose: () => void;
};

const PlacedMoveContent: React.FunctionComponent<{}> = () => {
  const auction = AuctionContainer.useContainer();
  const web3 = useWeb3React();
  const largeLayout = useMediaQuery(MEDIA_QUERY_COND);

  // Render nothing if the leadingBid is not loaded, easiest to check the move
  const amount = new utils.BigNumber(auction.leadingBid.amount);
  if (amount.isZero()) {
    return null;
  }

  const bidder =
    auction.leadingBid.bidder === web3.account
      ? 'You'
      : largeLayout
        ? auction.leadingBid.bidder
        : truncateAddress(auction.leadingBid.bidder);

  return (
    <Typography>{`Move was made by ${bidder}\n for ${utils.formatEther(amount)} ETH`}</Typography>
  );
};

const PlacedMove: React.FunctionComponent<Props> = ({
  onClose,
  result,
  address,
}) => {
  const title =
    result === AuctionResult.hit
      ? 'Hit!'
      : result === AuctionResult.miss
      ? 'Miss!'
      : 'Waiting for Oracle to reveal result';

  const renderPlacedMove = () => <PlacedMoveContent />;

  return (
    <AuctionContainer.Provider initialState={{ team: null, address }}>
      <Dialog
        title={title}
        onClose={onClose}
        open={result !== undefined}
        renderContent={renderPlacedMove}
      />
    </AuctionContainer.Provider>
  );
};

export default PlacedMove;
