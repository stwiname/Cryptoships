import * as moment from 'moment';
import * as React from 'react';
import useCountdown from '../hooks/useCountdown';

import { Typography } from '@material-ui/core';

type Props = {
  endTime: Date;
};

const Countdown: React.FunctionComponent<Props> = props => {
  const remainingMs = useCountdown(() => props.endTime);

  const duration: any = moment.duration(remainingMs);
  return (
    <Typography variant="subtitle1">
      {moment.utc(duration.asMilliseconds()).format('HH:mm:ss')}
    </Typography>
  );
};

export default Countdown;
