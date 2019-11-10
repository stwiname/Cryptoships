import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { match } from 'react-router-dom';
import { useWeb3Context } from 'web3-react';
import { Team } from '../../lib/contracts';
import { ErrorBoundary } from '../components';
import View from '../components/game';
import { Game as Container } from '../containers';

type Props = {
  match: match<{ address: string }>;
};

const Game: React.FunctionComponent<Props> = props => {
  const context = useWeb3Context();

  React.useEffect(() => {
    if (!context.active) {
      context.setFirstValidConnector(['MetaMask' /*, 'Infura'*/]);
    }
  }, []);

  if (!context.active && !context.error) {
    // loading
    return <Typography variant="h3">loading...</Typography>;
  } else if (context.error) {
    return <Typography variant="h3">error....</Typography>;
  }

  return (
    <ErrorBoundary>
      <Container.Provider initialState={props.match.params.address}>
        <View />
      </Container.Provider>
    </ErrorBoundary>
  );
};

export default Game;
