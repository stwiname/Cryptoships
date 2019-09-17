import * as React from 'react';
import { Team } from '../../lib/contracts';
import { Auction as AuctionInstance } from '../../types/ethers-contracts/Auction';

import { Typography, Card, CardContent, CardActions, Button, Box } from '@material-ui/core';

type Props = {
  team: Team;
  auction: AuctionInstance;
}

const Auction: React.FunctionComponent<Props> = (props: Props) => {
  const [hasStarted, setStarted] = React.useState<boolean>(false);
  const [leadingBid, setLeadingBid] = React.useState(null);

  React.useEffect(() => {
    if (props.auction) {
      props.auction.functions.getLeadingBid()
        .then(setLeadingBid);

      props.auction.functions.hasStarted()
        .then(setStarted);
    }
  }, [props.auction]);

  return <Card>
    <CardContent>
      <Typography variant='h6'>{Team[props.team]}</Typography>
      {
        props.auction && hasStarted
          ? <Box flexDirection='row' display='flex' alignItems='center'>
              <Typography variant='subtitle1'>Leading Bid: </Typography>
              <Typography variant='h5'>{leadingBid ? leadingBid.amount.toString() : '0'}</Typography>
            </Box>
          : <Typography variant='subtitle1'>Auction not yet started</Typography>
      }
      
    </CardContent>
    {/*<CardActions>
          <Button
            variant='contained'
            color='primary'
            disabled={!hasStarted}
          >
            Place Bid!
          </Button>
        </CardActions>*/}
  </Card>;
}

export default Auction;