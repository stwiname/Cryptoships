import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
import { useThemeStyles } from '../theme';
const Logo = require('../../dist/assets/cryptoships_wording_8.svg');

type Props = {
  subTitle?: string;
  hideHomeButton?: boolean;
};

const NotFound: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});

  return (
    <Box
      justifyContent='center'
      alignItems='center'
      display='flex'
      flexDirection='column'
      height='90vh'
      textAlign='center'
    >
      <Typography
        variant='h3'
        className={themeClasses.comingSoon}
        style={{ paddingBottom: '20px'}}
      >
        Ooops, we cant find this battle!
      </Typography>
      {
        props.subTitle &&
        <Typography variant='h5'>
          {props.subTitle}
        </Typography>
      }
      {
        !props.hideHomeButton &&
        <Button
          to={`/`}
          component={Link}
          size='large'
          color='primary'
          variant='outlined'
        >
          Take me home
        </Button>
      }
    </Box>
  );
};

export default NotFound;
