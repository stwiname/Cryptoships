import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import * as React from 'react';
import { HashRouter as Router, Link, Route, Switch } from 'react-router-dom';
import { Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import connectors from './connectors';
import Game from './routes/game';
import Home from './routes/home';
import About from './routes/about';
import Admin from './routes/admin';
import NotFound from './routes/notFound';
import theme from './theme';
import { Footer } from './components';
import { Connector, Wallet } from './containers';

const connectorKey = '@cryptoships/connectors';

function getLibrary(provider: any): providers.Web3Provider {
  const library = new providers.Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

const App: React.FunctionComponent<{}> = props => {
  const connectors = Connector.useContainer();

  React.useEffect(() => {
    connectors.activateSaved();
  }, []);

  return (
    <Container maxWidth={false}>
      <Router>
        <Switch>
          <Route exact={true} path="/" component={Home} />
          <Route path="/game/:address" component={Game} />
          <Route path="/how-it-works" component={About} />
          <Route path="/admin/:address" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </Container>
  );
}

const Providers: React.FunctionComponent<{}> = props => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Connector.Provider>
        <ThemeProvider theme={theme}>
          <Wallet.Provider>
            <CssBaseline />
            <App/>
            <Footer/>
          </Wallet.Provider>
        </ThemeProvider>
      </Connector.Provider>
    </Web3ReactProvider>
  );
}

export default Providers;
