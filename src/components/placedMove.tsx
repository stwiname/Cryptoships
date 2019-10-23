import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@material-ui/core';
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
