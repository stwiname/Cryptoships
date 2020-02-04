import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { useWeb3React } from '@web3-react/core';
import { truncateAddress } from '../utils';

const Logo = require('../../assets/cryptoships_wording_3.svg');

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
      >
        Connect Account
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
      <Grid item xs={2}/>
      <Grid item xs={8}>
        <Link to='/'>
          <img
            src={Logo}
            style={{ height: '100px', width: '100%', paddingTop: '10px' }}
          />
        </Link>
        </Grid>
      <Grid container item xs={2} alignItems='center' justify='flex-end'>
        { renderProfile() }
      </Grid>
    </Grid>
  );
}

export default Header;
