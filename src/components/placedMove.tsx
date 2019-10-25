import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { AuctionResult } from '../../lib/contracts';
import Dialog from './dialog';

export type Props = {
  result?: AuctionResult;
  onClose: () => void;
};

const PlacedMove: React.FunctionComponent<Props> = ({ onClose, result }) => {
  const title =
    result === AuctionResult.hit
      ? 'Hit!'
      : result === AuctionResult.miss
      ? 'Miss!'
      : null;

  return <Dialog title={title} onClose={onClose} open={result !== undefined} />;
};

export default PlacedMove;
