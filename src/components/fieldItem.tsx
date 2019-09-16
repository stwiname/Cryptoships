import * as React from 'react';
import { AuctionResult } from '../../lib/contracts';
import {blue, grey, red} from '@material-ui/core/colors';
import { ThemeProvider } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import theme from '../theme';

type Props = {
  state?: AuctionResult;
}

const fieldItem: React.FunctionComponent<Props> = ({ state }) => {
  const [result, setResult] = React.useState(AuctionResult.unset);

  const handlePress = () => {
    setResult(
      result === AuctionResult.unset
        ? AuctionResult.miss
        : result === AuctionResult.miss
          ? AuctionResult.hit
          : AuctionResult.unset
    );
  }

  return <ThemeProvider theme={theme}>
      <Button
        color={result === AuctionResult.unset ? 'secondary' : result === AuctionResult.miss ? 'primary' : undefined}
        variant='contained'
        style={result === AuctionResult.hit ? theme.palette.tertiary : undefined}
        //width={25}
        //height={25}
        onClick={handlePress}
      >_</Button>
    </ThemeProvider>;
}

export default fieldItem;
