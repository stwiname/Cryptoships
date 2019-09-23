import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Typography,
  Button,
  TextField,
  CircularProgress
} from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Team } from '../../lib/contracts';
import{ Game as Container } from '../containers';
import { utils } from 'ethers';
import { green } from '@material-ui/core/colors';

type Position = {
  x: number;
  y: number;
};

export type Props = {
  team: Team;
  position: Position;
  onClose: () => void;
}

const PlaceBid: React.FunctionComponent<Props> = ({ onClose, team, position }) => {
  const game = Container.useContainer();
  const classes = useStyles();
  // const gameLeadingBid = Team[team] === Team[Team.red]
  //   ? game.redLeadingBid
  //   : game.blueLeadingBid;
  // console.log("YOYO", gameLeadingBid, game.redLeadingBid, game.blueLeadingBid, team);
  const [amount, setAmount] = React.useState<string>((/*gameLeadingBid.amount.toString() ||*/ '0').toString());
  const [loading, setLoading] = React.useState(false);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  }

  const handlePlaceBid = async () => {
    try {
      setLoading(true);
      await game.placeBid(team, position, new utils.BigNumber(amount));

      setTimeout(onClose, 500);
    }
    finally {
      setLoading(false);
    }
  }

  const isValid = () => {
    try {
      new utils.BigNumber(amount);
      return true;
    }
    catch(e) {
      console.log('Invalid bid', amount, e);
      return false;
    }
  }

  return <Dialog
    onClose={onClose}
    open={true}
  >
    <DialogTitle>{`Place bid for ${Team[team] || ''} team`}</DialogTitle>
    <DialogContent>
      <DialogContentText>{`At postion: ${JSON.stringify(position)}`}</DialogContentText>
      <TextField
        label='Amount (wei)'
        value={amount}
        onChange={handleAmountChange}
        margin='normal'
        type='number'
        error={!isValid()}
        // min={minimumAmount || 0}
      />
    </DialogContent>
    <DialogActions>
      <div className={classes.wrapper}>
      <Button
        variant='contained'
        color='primary'
        onClick={handlePlaceBid}
        disabled={loading}
      >
        Place Bid!
      </Button>
      { loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
      </div>
    </DialogActions>
  </Dialog>;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      margin: theme.spacing(1),
      position: 'relative',
    },
    buttonProgress: {
      color: green[500],
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -12,
      marginLeft: -12,
    },
  }),
);

export default PlaceBid;