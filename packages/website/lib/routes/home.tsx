import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import useEnsGame from '../hooks/useEnsGame';
import { useThemeStyles } from '../theme';
import { ThreeDButton } from '../components'

const Logo = require('../../dist/assets/cryptoships_wording_8.svg');

type Props = {};

const Home: React.FunctionComponent<Props> = props => {
  const [address, setAddress] = React.useState<string>('');

  const ensAddress = useEnsGame();
  const themeClasses = useThemeStyles({});

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  return (
    <Box
      justifyContent='center'
      alignItems='center'
      display='flex'
      flexDirection='column'
      height='100vh'
    >
      <img src={Logo} style={{ height: '200px', width: '100vw', paddingLeft: '20px', paddingRight: '20px' }}/>
      <TextField
        label="Address"
        value={address || ensAddress || ''}
        onChange={handleAddressChange}
        margin="normal"
        variant='outlined'
      />
      <ThreeDButton
        to={`/game/${address || ensAddress}`}
        component={Link}
        disabled={!address && !ensAddress}
        variant='h3'
      >
        PLAY!
      </ThreeDButton>
    </Box>
  );
};

export default Home;
