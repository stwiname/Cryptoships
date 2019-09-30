import * as React from 'react';
import { AuctionResult } from '../../lib/contracts';
import {blue, grey, red} from '@material-ui/core/colors';
import Button from '@material-ui/core/Button';
import theme from '../theme';

type Props = {
  result?: AuctionResult;
  onClick?: () => void;
}

const fieldItem: React.FunctionComponent<Props> = ({ result, onClick }) => {
  return <Button
      color={result === AuctionResult.unset ? 'secondary' : result === AuctionResult.miss ? 'primary' : undefined}
      variant='contained'
      style={result === AuctionResult.hit ? theme.palette.tertiary : undefined}
      //width={25}
      //height={25}
      onClick={onClick}
    >_</Button>;
}

export default fieldItem;
