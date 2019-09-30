import * as React from 'react';
import { useWeb3Context } from 'web3-react';
import { match } from 'react-router-dom';
import { Team } from '../../lib/contracts';
import { Game as Container } from '../containers';
import View from '../components/game';

import { Typography, Grid } from '@material-ui/core';

type Props = {
  match: match<{ address: string }>;
}

const Game: React.FunctionComponent<Props> = (props) => {
  const context = useWeb3Context();

  React.useEffect(() => {
    if (!context.active) {
      context.setFirstValidConnector(['MetaMask'/*, 'Infura'*/])
    }
  }, []);

  if (!context.active && !context.error) {
    // loading
    return <Typography variant='h3'>loading...</Typography>
  } else if (context.error) {
    return <Typography variant='h3'>error....</Typography>
  }

  return <Container.Provider initialState={props.match.params.address}>
    <View/>
  </Container.Provider>;
}

export default Game;