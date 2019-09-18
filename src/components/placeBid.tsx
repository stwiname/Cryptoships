import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Typography,
  Button,
  TextField
} from '@material-ui/core';
import { Team } from '../../lib/contracts';
import { utils } from 'ethers';

type Position = {
  x: number;
  y: number;
};

export type Props = {
  team?: Team;
  position?: Position;
  minimumAmount?: utils.BigNumber;
  onClose: () => void;
  onSubmit: (team: Team, position: Position, amount: utils.BigNumber) => void;
}

const PlaceBid: React.FunctionComponent<Props> = ({ onClose, team, position, minimumAmount, onSubmit }) => {
  const [amount, setAmount] = React.useState<string>((minimumAmount || '0').toString());

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleAmountChange', typeof event.target.value);
    setAmount(event.target.value);
  }

  const handlePlaceBid = () => {
    onSubmit(team, position, new utils.BigNumber(amount));
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
      <Button
        variant='contained'
        color='primary'
        onClick={handlePlaceBid}
      >
        Place Bid!
      </Button>
    </DialogActions>
  </Dialog>;
}

export default PlaceBid;