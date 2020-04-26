import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import MUILink from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useWeb3React } from '@web3-react/core';
import { truncateAddress } from '../utils';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const Logo = require('../../assets/logo_blue.svg');
const Wording = require('../../assets/cryptoships_wording_8.svg');
const MetaMask = require('../../assets/metamask.svg');

type Props = {
  connectAccount?: () => void;
}

const Header: React.FunctionComponent<Props> = (props: Props) => {
  const context = useWeb3React();
  const largeLayout = useMediaQuery('(min-width:620px)');

  const [accountName, setAccountName] = React.useState<string>('');

  React.useEffect(() => {
    setAccountName(truncateAddress(context.account));

    if (!context.account) {
      return;
    }

    context.library.lookupAddress(context.account)
      .then((address: string) => {
        if (address) {
          setAccountName(address);
        }
      });
  }, [context.account]);

  const renderProfile = () => {
    if (accountName) {
      return <Button
        onClick={props.connectAccount}
        variant='outlined'
        color='primary'
        style={{ textTransform: 'none' }}
      >
        {accountName}
      </Button>
    }

    if (props.connectAccount) {
      return <Button
        onClick={props.connectAccount}
        variant='outlined'
        color='primary'
        endIcon={<img src={MetaMask} style={{ height: '25px'}}/>}
      >
        Connect to
      </Button>
    }

    return null;
  }

  const renderHowItWorks = () => {

    return (
      <Box m={2} fontWeight='fontWeightBold'>
        <MUILink
          to='/how-it-works'
          component={Link}
          color='secondary'
          variant='button'
          style={{ whiteSpace: 'nowrap' }}
        >
          How it works
        </MUILink>
      </Box>
    );
  }

  return <Box
    display='flex'
    flexDirection='row'

  >
    <Box alignItems='flex-start' display='flex' width='100%'>
      <Link to='/'>
        <Box display='flex' flexDirection='row'>
        {
          largeLayout &&
          <img
            src={Wording}
            style={{ height: '75px', paddingTop: '5px' }}
          />
        }
        <img
          src={Logo}
          style={{ height: '80px' }}
        />
        </Box>
      </Link>
    </Box>
    <Box
      alignItems='center'
      justifyContent='flex-end'
      display='flex'
    >
      { renderHowItWorks() }
      { renderProfile() }
    </Box>
  </Box>

  return (
    <Grid
      direction='row'
      spacing={2}
      container
      style={{ paddingBottom: 0 }}
    >
      <Grid
        item
        xs={4}
        style={{ paddingBottom: 0 }}
      >
        <Box alignItems='flex-start' display='flex'>
          <Link to='/'>
            <Box display='felx' flexDirection='row'>
            {
              /*largeLayout &&*/
              <img
                src={Wording}
                style={{ height: '75px', paddingTop: '5px' }}
              />
            }
            <img
              src={Logo}
              style={{ height: '80px' }}
            />
            </Box>
          </Link>
        </Box>
      </Grid>
      <Grid
        container
        item
        xs={8}
        alignItems='center'
        justify='flex-end'
        style={{ paddingBottom: 0 }}
      >
        { renderHowItWorks() }
        { renderProfile() }
      </Grid>
    </Grid>
  );
}

export default Header;
