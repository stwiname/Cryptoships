import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { match } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { Team } from '../../lib/contracts';
import { ErrorBoundary } from '../components';
import View from '../components/game';
import { Game as Container, Winnings } from '../containers';
import connectors from '../connectors';

type Props = {
  match: match<{ address: string }>;
};

const Game: React.FunctionComponent<Props> = props => {
  const context = useWeb3React();

  React.useEffect(() => {
    if (!context.active) {
      context.activate(connectors.MetaMask);
    }
  }, []);

  if (!context.active && !context.error) {
    // loading
    return <Typography variant="h3">loading...</Typography>;
  } else if (context.error) {
    console.error('Web3 context error', context.error);
    return <Typography variant="h3">error....</Typography>;
  }

  return (
    <ErrorBoundary>
      <Container.Provider initialState={props.match.params.address}>
        <Winnings.Provider initialState={props.match.params.address}>
          <View />
        </Winnings.Provider>
      </Container.Provider>
    </ErrorBoundary>
  );
};

export default Game;
