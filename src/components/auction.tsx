import * as React from 'react';
import { Team } from '../../lib/contracts';
import { Auction as AuctionInstance } from '../../types/ethers-contracts/Auction';

import { Typography, Card, CardContent, CardActions, Button, Box } from '@material-ui/core';
import Countdown from './countdown';

type Props = {
  team: Team;
  auction: AuctionInstance;
}

const Auction: React.FunctionComponent<Props> = (props: Props) => {
  const [leadingBid, setLeadingBid] = React.useState(null);
  const [startTime, setStartTime] = React.useState<Date>(null);
  const [endTime, setEndTime] = React.useState<Date>(null);

  React.useEffect(() => {
    if (props.auction) {
      props.auction.functions.getLeadingBid()
        .then(setLeadingBid);

      props.auction.functions.startTime()
        .then(startBN => setStartTime(new Date(startBN.toNumber() * 1000)));

      props.auction.functions.getEndTime()
        .then((endBN) => !endBN.isZero() && setEndTime(new Date(endBN.toNumber() * 1000)));
    }
  }, [props.auction]);


  const renderNotCreated = () => {
    if (!!props.auction) {
      return null;
    }
    return <Typography variant='subtitle1'>Auction not yet started</Typography>;
  }

  const renderStarting = () => {
    if (startTime && Date.now() < startTime.getTime()) {
      return <Box flexDirection='row' display='flex' alignItems='center'>
        <Typography variant='subtitle1'>Starts in: </Typography>
        <Countdown endTime={startTime}/>
      </Box>
    }
    return null;
  }

  const renderRunning = () => {
    if (!endTime && startTime && Date.now() > startTime.getTime() ||
        !!endTime && Date.now() < endTime.getTime()
    ) {
      return (
        <Box>
          <Box flexDirection='row' display='flex' alignItems='center'>
            {
              !!leadingBid && !leadingBid.amount.isZero()
                ? <>
                    <Typography variant='subtitle1'>Leading Bid: </Typography>
                    <Typography variant='h5'>{leadingBid.amount.toString()}</Typography>
                  </>
                : <Typography variant='subtitle1'>No bids made</Typography>
            }
            
          </Box>
          {
            !!endTime &&
            <Box flexDirection='row' display='flex' alignItems='center'>
              <Typography variant='subtitle1'>Ends in </Typography>
              <Countdown endTime={endTime}/>
            </Box>
          }
        </Box>
      );
    }

    return null;
  }

  const renderFinished = () => {
    return <Typography variant='subtitle1'>Auction has finished</Typography>;
  }

  return <Card>
    <CardContent>
      <Typography variant='h6'>{Team[props.team]}</Typography>
      {
        renderNotCreated() ||
        renderStarting() ||
        renderRunning() ||
        renderFinished()
      }
      
    </CardContent>
  </Card>;
}

export default Auction;