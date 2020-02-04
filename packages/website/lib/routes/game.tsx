import Grid from '@material-ui/core/Grid';
import MuiContainer from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { match } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { Team } from '../../lib/contracts';
import { ErrorBoundary, Header } from '../components';
import View from '../components/game';
import { Game as Container, Winnings } from '../containers';
import connectors from '../connectors';

type Props = {
  match: match<{ address: string }>;
};

const Game: React.FunctionComponent<Props> = props => {
  const context = useWeb3React();

  const activateDefault = () => {
    context.activate(connectors.Network);
  }

  const activateMetamask = () => {
    context.activate(
      connectors.MetaMask,
      activateDefault,
    );
  }

  React.useEffect(() => {
    if (!context.active) {
      activateDefault();
    }
  }, []);

  const renderContent = () => {
    if (!context.active && !context.error) {
      console.log('Context error', context.error);
      // loading
      return <Typography variant="h3">loading...</Typography>;
    } else if (context.error) {
      console.error('Web3 context error', context.error);
      return <Typography variant="h3">error....</Typography>;
    }

    return (
      <Container.Provider initialState={props.match.params.address}>
        <Winnings.Provider initialState={props.match.params.address}>
          <View />
        </Winnings.Provider>
      </Container.Provider>
    );
  }

  return (
    // <MuiContainer>
      <ErrorBoundary>
        <Header
          connectAccount={activateMetamask}
        />
        { renderContent() }
      </ErrorBoundary>
    // </MuiContainer>
  );
};

export default Game;
