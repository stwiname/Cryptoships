import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
import useEnsGame from '../hooks/useEnsGame';
const Logo = require('../../dist/assets/cryptoships_wording_8.svg');

type Props = {};

const Home: React.FunctionComponent<Props> = props => {
  const [address, setAddress] = React.useState<string>('');

  const ensAddress = useEnsGame();

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
      <img src={Logo} style={{ height: '200px', width: '100vw' }}/>
      <TextField
        label="Address"
        value={address || ensAddress || ''}
        onChange={handleAddressChange}
        margin="normal"
        variant='outlined'
      />
      <Button
        to={`/game/${address || ensAddress}`}
        component={Link}
        variant="contained"
        disabled={!address && !ensAddress}
      >
        Play!
      </Button>
    </Box>
  );
};

export default Home;
