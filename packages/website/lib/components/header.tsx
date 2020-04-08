import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useWeb3React } from '@web3-react/core';
import { truncateAddress } from '../utils';

const Logo = require('../../assets/cryptoships_wording_3.svg');
const MetaMask = require('../../assets/metamask.svg');

type Props = {
  connectAccount?: () => void;
}

const Header: React.FunctionComponent<Props> = (props: Props) => {
  const context = useWeb3React();

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

  return (
    <Grid
      direction='row'
      spacing={2}
      container
    >
      <Grid
        item
        xs={6}
      >
        <Box alignItems='flex-start' display='flex'>
          <Link to='/'>
            <img
              src={Logo}
              style={{ width: '100%', minHeight: '60px', paddingTop: '10px' }}
            />
          </Link>
        </Box>
      </Grid>
      <Grid container item xs={6} alignItems='center' justify='flex-end'>
        { renderProfile() }
      </Grid>
    </Grid>
  );
}

export default Header;
