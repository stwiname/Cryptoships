import { DialogContentText, TextField, Typography } from '@material-ui/core';
import { green } from '@material-ui/core/colors';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { utils } from 'ethers';
import { path } from 'ramda';
import * as React from 'react';
import { Team } from '../../lib/contracts';
import { Game as Container } from '../containers';
import { numToBase64 } from '../utils';

import Dialog from './dialog';

type Position = {
  x: number;
  y: number;
};

export type Props = {
  team?: Team;
  position?: Position;
  auctionContainer?: any;
  onClose: () => void;
};

const PlaceBid: React.FunctionComponent<Props> = ({
  onClose,
  team,
  position,
  auctionContainer,
}) => {
  const game = Container.useContainer();
  const auction = auctionContainer.useContainer();
  // const gameLeadingBid = Team[team] === Team[Team.red]
  //   ? game.redLeadingBid
  //   : game.blueLeadingBid;
  // console.log("YOYO", gameLeadingBid, game.redLeadingBid, game.blueLeadingBid, team);
  const [amount, setAmount] = React.useState<string>(
    (path(['leadingBid', 'amount'], auction) || '0').toString()
  );
  const [loading, setLoading] = React.useState(false);
  const [auctionRunning, setAuctionRunning] = React.useState(false);

  React.useEffect(() => {
    setAmount((path(['leadingBid', 'amount'], auction) || '0').toString());

    if (team !== undefined) {
      setAuctionRunning(auction.hasStarted() && !auction.hasEnded());
    }
  }, [team]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const handlePlaceBid = async () => {
    try {
      setLoading(true);
      await game.placeBid(team, position, new utils.BigNumber(amount));

      setTimeout(onClose, 500);
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    try {
      return !new utils.BigNumber(amount).isZero();
    } catch (e) {
      console.log('Invalid bid', amount, e);
      return false;
    }
  };

  const renderContent = () => {
    return (
      <>
        {position && (
          <DialogContentText>
            {`At postion: ${numToBase64(position.x)}${position.y}`}
          </DialogContentText>
        )}
        <TextField
          label="Amount (wei)"
          value={amount}
          onChange={handleAmountChange}
          margin="normal"
          type="number"
          error={!isValid()}
        />
      </>
    );
  };

  const title = auctionRunning
    ? `Place bid for ${Team[team] || ''} team`
    : `Waiting for other team to make a move`;

  return (
    <Dialog
      title={title}
      onClose={onClose}
      open={team !== undefined}
      loading={loading}
      onSubmit={auctionRunning && handlePlaceBid}
      submitTitle="Place Bid!"
      renderContent={auctionRunning && renderContent}
    />
  );
};

export default PlaceBid;
