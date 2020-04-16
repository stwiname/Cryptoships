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
import { hexToRgb, createRadial } from '../utils';
import clsx from 'clsx';

const useStyles = makeStyles<Theme>({
  button: {
    display: 'flex',
    width: '100%',
    height: 50,
  },
  hit: {
    background: createRadial(theme.palette.secondary.main),
  },
  miss: {
    background: createRadial(theme.palette.primary.dark),
  },
  target: {
    background: createRadial(theme.palette.tertiary.dark),
  },
  aiming: {
    background: createRadial(theme.palette.tertiary.light)
  }
});

type Props = {
  result?: AuctionResult | "aiming";
  onClick?: () => void;
};

const fieldItem: React.FunctionComponent<Props> = ({ result, onClick }) => {
  let colorClass;
  let renderIcon: () => React.ReactElement;

  const classes = useStyles({ /*color: createRadial(color.main) as any*/ });

  switch (result) {
    case AuctionResult.unset:
      colorClass = null;
      break;
    case AuctionResult.hit:
      colorClass = classes.hit;
      break;
    case AuctionResult.miss:
      colorClass = classes.miss;
      break;
    case "aiming":
      colorClass = classes.aiming;
      renderIcon = () => <GpsNotFixedIcon fontSize="large" />;
      break;
    default:
      colorClass = classes.target;
      renderIcon = () => <GpsNotFixedIcon fontSize="large" />;
      break;
  }

  return (
    <ButtonBase
      onClick={onClick}
      className={clsx(classes.button, colorClass)}
      disabled={!onClick}
    >
        {!!renderIcon && renderIcon()}
    </ButtonBase>
  );
};

export default fieldItem;
