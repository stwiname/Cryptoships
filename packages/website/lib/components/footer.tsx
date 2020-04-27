import * as React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const Reddit = require('../../dist/assets/reddit.svg');

type Props = {

}

const Footer: React.FunctionComponent<Props> = (props: Props) => {

  return <Box
    width='100%'
    style={{ padding: '10px' }}
    display='flex'
    flexDirection='row'
    justifyContent='center'
    alignItems='center'
  >
    <Typography variant='body1' color='primary'>Community:</Typography>
    <a href='https://reddit.com/r/cryptoships' target='_blank'>
      <img src={Reddit} height='30px' style={{ paddingLeft: '10px' }} />
    </a>
  </Box>;
}

export default Footer;
