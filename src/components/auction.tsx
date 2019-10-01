import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@material-ui/core';
import * as React from 'react';
import { Team } from '../../lib/contracts';
import { numToBase64 } from '../utils';
import Countdown from './countdown';

type Props = {
  container: any;
};

const Auction: React.FunctionComponent<Props> = (props: Props) => {
  const auction = props.container.useContainer();

  const renderNotCreated = () => {
    if (!!auction.auctionAddress) {
      return null;
    }
    return <Typography variant="subtitle1">Auction not yet started</Typography>;
  };

  const renderStarting = () => {
    if (auction.startTime && Date.now() < auction.startTime.getTime()) {
      return (
        <Box flexDirection="row" display="flex" alignItems="center">
          <Typography variant="subtitle1">Starts in: </Typography>
          <Countdown endTime={auction.startTime} />
        </Box>
      );
    }
    return null;
  };

  const renderRunning = () => {
    if ((!auction.endTime && auction.hasStarted()) || !auction.hasEnded()) {
      return (
        <Box>
          <Box flexDirection="row" display="flex" alignItems="center">
            {!!auction.leadingBid && !auction.leadingBid.amount.isZero() ? (
              <>
                <Typography variant="subtitle1">Leading Bid:&nbsp;</Typography>
                <Typography variant="h5">
                  {auction.leadingBid.amount.toString()}
                </Typography>
                <Typography variant="subtitle1">
                  {` wei @ ${numToBase64(auction.leadingBid.move[0])}, ${
                    auction.leadingBid.move[1]
                  }`}
                </Typography>
              </>
            ) : (
              <Typography variant="subtitle1">No bids made</Typography>
            )}
          </Box>
          {!!auction.endTime && (
            <Box flexDirection="row" display="flex" alignItems="center">
              <Typography variant="subtitle1">Ends in&nbsp;</Typography>
              <Countdown endTime={auction.endTime} />
            </Box>
          )}
        </Box>
      );
    }

    return null;
  };

  const renderFinished = () => {
    return (
      <Typography variant="subtitle1">
        Auction has finished, waiting for other team to make a move
      </Typography>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{Team[auction.team]}</Typography>
        {renderNotCreated() ||
          renderStarting() ||
          renderRunning() ||
          renderFinished()}
      </CardContent>
    </Card>
  );
};

export default Auction;
