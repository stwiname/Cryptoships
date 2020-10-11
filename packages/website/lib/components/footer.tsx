import * as React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const Reddit = require('../../dist/assets/reddit.svg');
const Github = require('../../dist/assets/Github.svg');

type Props = {

}

const SocialIcon: React.FC<{src: any, href: string}> = ({ src, href }) => {
  return <a href={href} target='_blank' style={{ marginLeft: '10px' }} >
    <img src={src} height='30px'/>
  </a>
}

const Footer: React.FC<Props> = props => {

  return <Box
    width='100%'
    style={{ padding: '10px' }}
    display='flex'
    flexDirection='row'
    justifyContent='center'
    alignItems='center'
  >
    <Typography variant='body1' color='primary'>Community:</Typography>
    <SocialIcon src={Reddit} href='https://reddit.com/r/cryptoships'/>
    <SocialIcon src={Github} href='https://github.com/stwiname/cryptoships'/>
  </Box>;
}

export default Footer;
