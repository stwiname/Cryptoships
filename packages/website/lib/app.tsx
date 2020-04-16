import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import * as React from 'react';
import { HashRouter as Router, Link, Route, Switch } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core'
import { providers } from 'ethers';
import Field from './components/field';
import connectors from './connectors';
import Game from './routes/game';
import Home from './routes/home';
import About from './routes/about';
import NotFound from './routes/notFound';
import theme, { appBackground } from './theme';


function getLibrary(provider: any): providers.Web3Provider {
  const library = new providers.Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

class App extends React.PureComponent<{}> {
  public render() {
    return (
      <Web3ReactProvider  getLibrary={getLibrary}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div style={appBackground}>
            <Container maxWidth={false}>
              <Router>
                <Switch>
                  <Route exact={true} path="/" component={Home} />
                  <Route path="/game/:address" component={Game} />
                  <Route path="/how-it-works" component={About} />
                  <Route component={NotFound} />
                </Switch>
              </Router>
            </Container>
          </div>
        </ThemeProvider>
      </Web3ReactProvider>
    );
  }
}

export default App;
