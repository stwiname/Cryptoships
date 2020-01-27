import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import MuiContainer from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';
import { ReactSVG as SVG } from 'react-svg';
import { useThemeStyles } from '../theme';

type Props = {};

const Home: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});
  const [address, setAddress] = React.useState(
    '0xD5E727E39D77677B952879e4F620e358a1BccD6A'
  );

  // React.useEffect(() => {
  //   if (!context.active) {
  //     context.activate(connectors.MetaMask);
  //   }
  // }, []);

  // if (!context.active && !context.error) {
  //   // loading
  //   return (
  //     <div>
  //       <Typography variant="h3">loading...</Typography>
  //     </div>
  //   );
  // } else if (context.error) {
  //   return (
  //     <div>
  //       <Typography variant="h3">Error :(</Typography>
  //       <Typography variant="h4">{context.error.toString()}</Typography>
  //     </div>
  //   );
  // }

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
      >
        <SVG
          src='../../assets/cryptoships_wording_3.svg'
          renumerateIRIElements={false}
          beforeInjection={svg => {
            svg.classList.add('svg-class-name')
            svg.setAttribute('style', 'height: 200px; width: 100%; padding-top: 10px;')
          }}
        />
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
