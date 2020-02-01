import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
import { useThemeStyles } from '../theme';
const Logo = require('../../assets/cryptoships_wording_3.svg');

type Props = {};

const NotFound: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});

  return (
    <Box
      justifyContent='center'
      alignItems='center'
      display='flex'
      flexDirection='column'
      height='100vh'
    >
      <Typography
        variant='h3'
        className={themeClasses.comingSoon}
        style={{ paddingBottom: '20px'}}
      >
        Ooops, we cant find this battle!
      </Typography>
      <Button
        to={`/`}
        component={Link}
        size='large'
        color='primary'
      >
        Take me home
      </Button>
    </Box>
  );
};

export default NotFound;
