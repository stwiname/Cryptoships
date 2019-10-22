import ButtonBase from '@material-ui/core/ButtonBase';
import { blue, grey, red } from '@material-ui/core/colors';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import * as React from 'react';
import { AuctionResult } from '../../lib/contracts';
import theme from '../theme';

const useStyles = makeStyles({
  button: {
    display: 'flex',
    width: '100%',
    height: 50,
    background: props => props.color.main,
    '&:hover': {
      background: props => props.color.light,
    },
  },
});

type Props = {
  result?: AuctionResult;
  onClick?: () => void;
};

const fieldItem: React.FunctionComponent<Props> = ({ result, onClick }) => {
  const color =
    theme.palette[
      result === AuctionResult.unset || !result
        ? 'secondary'
        : result === AuctionResult.hit
        ? 'tertiary'
        : 'primary'
    ];
  const classes = useStyles({ color });
  return <ButtonBase onClick={onClick} className={classes.button} />;
};

export default fieldItem;
