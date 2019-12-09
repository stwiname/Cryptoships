import Typography from '@material-ui/core/Typography';
import * as moment from 'moment';
import * as React from 'react';
import useCountdown from '../hooks/useCountdown';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      position: 'relative',
      justifyContent: 'center'
    },
    buttonProgress: {
      position: 'absolute',
    },
  })
);


type Props = {
  endTime: Date;
  duration?: number;
};

const Countdown: React.FunctionComponent<Props> = props => {

  const formatDuration = (duration: moment.Duration): string => {

    const displayAmount = (unit: number, suffix: string) => {
      if (unit < 1) {
        return null;
      }

      return Math.round(unit) + suffix;
    }

    return displayAmount(duration.asDays(), 'd') ||
      displayAmount(duration.asHours(), 'h') ||
      displayAmount(duration.asMinutes(), 'm') ||
      displayAmount(duration.asSeconds(), 's') ||
      'GO';
  }

  const classes = useStyles({});
  const remainingMs = useCountdown(props.endTime);

  const percent = props.duration && props.endTime && Date.now() < props.endTime.getTime()
    ? (Date.now() - props.endTime.getTime()) / props.duration * 100
    : 100;

  const duration = moment.duration(remainingMs);
  return (
    <Box className={classes.wrapper} display='flex' alignItems='center'>
      <CircularProgress variant='static' size={92} value={percent} thickness={5}/>
      <Box display='flex' alignItems='center' className={classes.buttonProgress}>
        <Typography variant="h5" >
          {formatDuration(duration)}
        </Typography>
      </Box>
    </Box>
  );
};

export default Countdown;
