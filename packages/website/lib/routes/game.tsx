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
import useQuery from '../hooks/useQuery';

const connectorKey = '@cryptoships/connectors';

type Props = {
  match: match<{ address: string }>;
};

const Game: React.FunctionComponent<Props> = props => {
  const context = useWeb3React();
  const query = useQuery();
  const history = useHistory();

  const activateDefault = () => {
    return context.activate(connectors.Network);
  }

  const activateMetamask = async () => {
    await context.activate(
      connectors.MetaMask,
      activateDefault,
    );

    window.localStorage.setItem(connectorKey, 'metamask');
  }

  React.useEffect(() => {
    // Activate straight away, metamask might be locked
    activateDefault()
      .then(() => {
        if (!context.active) {
          const usedConnector = window.localStorage.getItem(connectorKey);
          switch (usedConnector) {
            case "metamask":
              activateMetamask();
              break;
            default:
              // activateDefault();
              break;
          }
        }
      });
  }, []);

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
        connectAccount={activateMetamask}
      />
      { renderContent() }
    </ErrorBoundary>
  );
};

export default Game;
