import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import capitalize from '@material-ui/core/utils/capitalize';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useWeb3React } from '@web3-react/core';
import * as React from 'react';
import { Team } from '../contracts';
import { moveToString } from '../utils';
import { utils } from 'ethers'
import Countdown from './countdown';
import { path } from 'ramda';

type Props = {
  container: any;
};

const Auction: React.FunctionComponent<Props> = (props: Props) => {
  const auction = props.container.useContainer();
  const { account } = useWeb3React();

  const renderNewAuction = () => {
    const isRunning = !!auction && auction.hasStarted() && !auction.hasEnded();
    const hasMove = auction.leadingBid && !auction.leadingBid.amount.isZero();
    const amount: utils.BigNumber = (isRunning && path(['leadingBid', 'amount'], auction) || new utils.BigNumber(0));

    const move =
      isRunning
        ? hasMove
          ? moveToString(
              auction.leadingBid.move[0],
              auction.leadingBid.move[1]
            )
          : 'Make a move'
        : !!auction && (auction.hasEnded() || !auction.startTime)
          ? 'Waiting'
          : 'XX';

    const subtitle =
      isRunning
        ? hasMove
          ? account === auction.leadingBid.bidder
            ? 'You are leading'
            : auction.leadingBid.bidder
          : 'This teams turn'
        : !!auction && auction.startTime && Date.now() < auction.startTime.getTime()
          ? 'Starting soon'
          : 'Other teams turn';

    return <Box>
      <Box flexDirection='row' display='flex' justifyContent='space-between'>
        <Box>
          <Typography variant='h2'>
            <Box fontWeight={400}>
              {move}
            </Box>
          </Typography>
          <Typography variant='h5'>
            {`${utils.formatEther(amount)} ETH`}
          </Typography>
        </Box>
        {
          !!auction && !auction.hasEnded() &&
          <Countdown
            endTime={auction.endTime || auction.startTime}
            duration={auction.endTime && auction.duration}

          />}
      </Box>
      <Typography variant='subtitle1'>
        {subtitle}
      </Typography>
    </Box>
  }

  return (
    <Card>
      <CardContent>
        {renderNewAuction()}
      </CardContent>
    </Card>
  );
};

export default Auction;
