import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
import { useThemeStyles } from '../theme';
import useEnsGame from '../hooks/useEnsGame';
const Logo = require('../../assets/cryptoships_wording_3.svg');

type Props = {};

const Home: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});
  const [address, setAddress] = React.useState<string>('');

  const ensAddress = useEnsGame();

  const context = useWeb3React();

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  React.useEffect(() => {
    if (!context.active) {
      context.activate(
        connectors.MetaMask,
        () => {
          context.activate(connectors.Network)
        }
      );
    }
  }, []);

  if (!context.active && !context.error) {
    console.log('Context error', context.error);
    // loading
    return <Typography variant="h3">loading...</Typography>;
  } else if (context.error) {
    console.error('Web3 context error', context.error);
    return <Typography variant="h3">error....</Typography>;
  }

  return (
      <Box
        justifyContent='center'
        alignItems='center'
        display='flex'
        flexDirection='column'
        height='100vh'
      >
        <img src={Logo} style={{ height: '200px', width: '100vw' }}/>
        {/*<Typography
            variant='h2'
            className={themeClasses.comingSoon}
          >
            Coming Soon
          </Typography>*/}
        <TextField
          label="Address"
          value={address || ensAddress || ''}
          onChange={handleAddressChange}
          margin="normal"
        />
        <Button
          to={`/game/${address || ensAddress}`}
          component={Link}
          variant="contained"
          disabled={!address && !ensAddress}
          size='large'
          className={themeClasses.buttonMain}
        >
          Play!
        </Button>
      </Box>
  );
};

export default Home;
