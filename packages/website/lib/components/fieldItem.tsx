import ButtonBase from '@material-ui/core/ButtonBase';
import { blue, grey, red } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import { PaletteColor } from '@material-ui/core/styles/createPalette';
import SvgIcon from '@material-ui/core/SvgIcon';
import GpsNotFixedIcon from '@material-ui/icons/GpsNotFixed';
import path from 'ramda/src/path';
import * as React from 'react';
import { AuctionResult } from '../contracts';
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
  let color: PaletteColor;
  let renderIcon: () => React.ReactElement;

  switch (result) {
    case AuctionResult.unset:
      color = theme.palette.secondary;
      break;
    case AuctionResult.hit:
      color = theme.palette.tertiary;
      break;
    case AuctionResult.miss:
      color = theme.palette.primary;
      break;
    default:
      color = {
        main: 'darkorange',
        light: '#ffbe00',
        dark: null,
        contrastText: null,
      };
      renderIcon = () => <GpsNotFixedIcon fontSize="large" />;
      break;
  }

  const classes = useStyles({ color });
  return (
    <ButtonBase onClick={onClick} className={classes.button}>
      {!!renderIcon && renderIcon()}
    </ButtonBase>
  );
};

export default fieldItem;
