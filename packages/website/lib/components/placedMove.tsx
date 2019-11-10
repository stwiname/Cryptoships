import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { utils } from 'ethers';
import equals from 'ramda/src/equals';
import * as React from 'react';
import { useWeb3Context } from 'web3-react';
import { AuctionResult } from '../contracts';
import { createAuctionContainer } from '../containers';
import Dialog from './dialog';

const AuctionContainer = createAuctionContainer();

export type Props = {
  result?: AuctionResult;
  address?: string;
  onClose: () => void;
};

const PlacedMoveContent: React.FunctionComponent<{}> = () => {
  const auction = AuctionContainer.useContainer();
  const web3 = useWeb3Context();

  // Render nothing if the leadingBid is not loaded, easiest to check the move
  const amount = new utils.BigNumber(auction.leadingBid.amount);
  if (amount.isZero()) {
    return null;
  }

  const bidder =
    auction.leadingBid.bidder === web3.account
      ? 'You'
      : auction.leadingBid.bidder;

  return (
    <Typography>{`Move was made by ${bidder}\n for ${amount.toString()} wei`}</Typography>
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
      : null;

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
