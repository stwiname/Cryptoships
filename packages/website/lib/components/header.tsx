import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useWeb3React } from '@web3-react/core';
import { truncateAddress } from '../utils';
import { isMobile } from 'react-device-detect';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ThreeDButton from './3dbutton';

const Logo = require('../../dist/assets/logo_blue.svg');
const Wording = require('../../dist/assets/cryptoships_wording_8.svg');
const MetaMask = require('../../dist/assets/metamask.svg');
const Sylo = require('../../dist/assets/sylo.svg');

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
      setAccountName('');
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

    const image = isMobile
      ? (window as any)?.ethereum?.isMetaMask
        ? MetaMask
        : (window as any)?.ethereum?.isSylo
          ? Sylo
          : undefined
      : undefined

    return <Button
      onClick={props.connectAccount}
      variant='outlined'
      color='primary'
      endIcon={image && <img src={image} style={{ height: '25px'}}/>}
      style={{ whiteSpace: 'nowrap' }}
    >
      {`Connect ${ image ? 'to ' : 'wallet'}`}
    </Button>;
  }

  const renderHowItWorks = () => {

    return <Box m={2}>
      <ThreeDButton
        component={Link}
        to='/how-it-works'
        variant='button'
      >
        HOW IT WORKS
      </ThreeDButton>
    </Box>
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
          style={{ height: largeLayout ? '80px' : '60px' }}
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
