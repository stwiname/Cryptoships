import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import connectors from '../connectors';

type Props = {};

const Home: React.FunctionComponent<Props> = props => {
  const context = useWeb3React();
  const [address, setAddress] = React.useState(
    '0xD5E727E39D77677B952879e4F620e358a1BccD6A'
  );

  React.useEffect(() => {
    if (!context.active) {
      context.activate(connectors.MetaMask);
    }
  }, []);

  if (!context.active && !context.error) {
    // loading
    return (
      <div>
        <Typography variant="h3">loading...</Typography>
      </div>
    );
  } else if (context.error) {
    return (
      <div>
        <Typography variant="h3">Error :(</Typography>
        <Typography variant="h4">{context.error.toString()}</Typography>
      </div>
    );
  }

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  return (
    <div>
      <TextField
        label="Address"
        // className={classes.textField}
        value={address}
        onChange={handleAddressChange}
        margin="normal"
      />
      <Button
        to={`/game/${address}`}
        component={Link}
        variant="contained"
        color="primary"
        disabled={!address}
      >
        Play!
      </Button>
    </div>
  );
};

export default Home;
