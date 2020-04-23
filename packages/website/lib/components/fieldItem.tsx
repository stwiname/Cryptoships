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
const Flame = require('../../assets/flame_1.svg');
const Crosshair = require('../../assets/crosshair_6.svg');

const useStyles = makeStyles<Theme>({
  button: {
    width: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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

  const renderImage = (src: string) => {
    return <img src={src} style={{ height: '75%', width: '75%' }}/>;
  }

  switch (result) {
    case AuctionResult.unset:
      colorClass = null;
      break;
    case AuctionResult.hit:
      colorClass = classes.hit;
      renderIcon = () => renderImage(Flame);
      break;
    case AuctionResult.miss:
      colorClass = classes.miss;
      break;
    case "aiming":
      colorClass = classes.aiming;
      renderIcon = () => renderImage(Crosshair);
      break;
    default:
      colorClass = classes.target;
      renderIcon = () => renderImage(Crosshair);
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
