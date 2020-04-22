import Grid from '@material-ui/core/Grid';
import MuiContainer from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { match, useHistory } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { Team } from '../../lib/contracts';
import { ErrorBoundary, Header } from '../components';
import View from '../components/game';
import { Game as Container, Winnings } from '../containers';
import connectors from '../connectors';
import { useQuery, useConnector } from '../hooks';

type Props = {
  match: match<{ address: string }>;
};

const Game: React.FunctionComponent<Props> = props => {
  const connector = useConnector();
  const context = useWeb3React();
  const query = useQuery();
  const history = useHistory();

  const handleSetTeam = (team: Team) => {
    history.push({
      pathname: history.location.pathname,
      search: `?team=${team.toString()}`
    });
  }

  const getTeam = () => {
    const rawTeam = query.get('team');

    switch (rawTeam) {
      case "blue":
      case "1":
        return Team.blue;
      case "red":
      case "0":
      default:
        return Team.red;
    }
  }

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
          <View team={getTeam()} setTeam={handleSetTeam}/>
        </Winnings.Provider>
      </Container.Provider>
    );
  }

  return (
    <ErrorBoundary>
      <Header
        connectAccount={connector.activateMetamask}
      />
      { renderContent() }
    </ErrorBoundary>
  );
};

export default Game;
