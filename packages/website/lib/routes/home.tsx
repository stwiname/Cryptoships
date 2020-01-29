import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import MuiContainer from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
import { useThemeStyles } from '../theme';
const Logo = require('../../assets/cryptoships_wording_3.svg');

type Props = {};

const Home: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});
  const [address, setAddress] = React.useState(
    '0xD5E727E39D77677B952879e4F620e358a1BccD6A'
  );

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  return (
    <MuiContainer maxWidth={false}>
      <Box
        justifyContent='center'
        alignItems='center'
        display='flex'
        flexDirection='column'
        style={{ height: '100%' }}
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
          value={address}
          onChange={handleAddressChange}
          margin="normal"
        />
        <Button
          to={`/game/${address}`}
          component={Link}
          variant="contained"
          disabled={!address}
          size='large'
          className={themeClasses.buttonMain}
        >
          Play!
        </Button>
      </Box>
    </MuiContainer>
  );
};

export default Home;
