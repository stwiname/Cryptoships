import ButtonBase from '@material-ui/core/ButtonBase';
import { blue, grey, red } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import { PaletteColor } from '@material-ui/core/styles/createPalette';
import { path } from 'ramda';
import * as React from 'react';
import { AuctionResult } from '../../lib/contracts';
import theme from '../theme';

const useStyles = makeStyles<Theme, { color: PaletteColor }>({
  button: {
    display: 'flex',
    width: '100%',
    height: 50,
    background: path(['color', 'main']),
    '&:hover': {
      background: path(['color', 'light']),
    },
  },
});

type Props = {
  result?: AuctionResult;
  onClick?: () => void;
};

const fieldItem: React.FunctionComponent<Props> = ({ result, onClick }) => {
  const color =
    result === AuctionResult.unset
      ? theme.palette.secondary
      : result === AuctionResult.hit
      ? theme.palette.tertiary
      : result === AuctionResult.miss
      ? theme.palette.primary
      : null;
  const classes = useStyles({ color });
  return <ButtonBase onClick={onClick} className={classes.button} />;
};

export default fieldItem;
