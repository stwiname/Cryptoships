import * as React from 'react';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import { useThemeStyles } from '../theme';

type Props = {

}

const Loading: React.FunctionComponent<Props> = (props: Props) => {

  const [completed, setCompleted] = React.useState(0);
  const [buffer, setBuffer] = React.useState(10);
  const classes = useThemeStyles({});

  const progress = React.useRef(() => {});
  React.useEffect(() => {
    progress.current = () => {
      if (completed > 100) {
        return;
      } else {
        const diff = Math.random() * 20;
        const diff2 = Math.random() * 20;
        setCompleted(Math.min(completed + diff, 100));
        setBuffer(completed + diff + diff2);
      }
    };
  });

  React.useEffect(() => {
    function tick() {
      progress.current();
    }
    const timer = setInterval(tick, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);


  return <Box
    justifyContent='center'
    alignItems='center'
    display='flex'
    flexDirection='column'
    height='90vh'
    textAlign='center'
  >
    <Typography
      variant='h3'
      className={classes.yellow}
      style={{ paddingBottom: '20px'}}
    >
      Loading...
    </Typography>
    <LinearProgress
      variant="buffer"
      value={completed}
      valueBuffer={buffer}
      style={{ width: '80%', maxWidth: '600px', height: 8 }}
    />
  </Box>;
}

export default Loading;
