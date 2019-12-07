import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import capitalize from '@material-ui/core/utils/capitalize';
import CircularProgress from '@material-ui/core/CircularProgress';
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

  const renderNewAuction = () => {
    const isRunning = !!auction && (!auction.endTime && auction.hasStarted() || !auction.hasEnded());
    const hasMove = auction.leadingBid && !auction.leadingBid.amount.isZero();
    const amount: utils.BigNumber = (isRunning && path(['leadingBid', 'amount'], auction) || new utils.BigNumber(0));
    const move = isRunning && hasMove
      ? moveToString(
          auction.leadingBid.move[0],
          auction.leadingBid.move[1]
        )
       : 'XX';

    const subtitle =
      isRunning
        ? hasMove
          ? auction.leadingBid.bidder
          : 'Make a move'
        : !!auction && Date.now() < auction.startTime.getTime()
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
        { !!auction && <Countdown endTime={auction.endTime} duration={auction.duration}/>}
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
