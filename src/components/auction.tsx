import * as React from 'react';
import { Team } from '../../lib/contracts';
import { Auction as AuctionInstance } from '../../types/ethers-contracts/Auction';

import { Typography, Card, CardContent, CardActions, Button, Box } from '@material-ui/core';

type Props = {
  team: Team;
  auction: AuctionInstance;
}

const Auction: React.FunctionComponent<Props> = (props: Props) => {

  const [leadingBid, setLeadingBid] = React.useState(null);

  if (props.auction) {
    return null;
  }

  React.useEffect(() => {
    if (props.auction) {
      props.auction.functions.getLeadingBid()
        .then(bid => setLeadingBid(bid));
    }
  }, []);

  return <Card>
    <CardContent>
      <Typography variant='h6'>{Team[props.team]}</Typography>
      <br/>
      <Box flexDirection='row' display='flex' alignItems='center'>
        <Typography variant='subtitle1'>Leading Bid: </Typography>
        <Typography variant='h5'>{leadingBid ? leadingBid.amount.toString() : '0'}</Typography>
      </Box>
    </CardContent>
    <CardActions>
      <Button
        variant='contained'
        color='primary'
      >
        Place Bid!
      </Button>
    </CardActions>
  </Card>;
}

export default Auction;