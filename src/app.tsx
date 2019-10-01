import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/styles';
import * as React from 'react';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import Web3Provider from 'web3-react';
import Field from './components/field';
import connectors from './connectors';
import Game from './routes/game';
import Home from './routes/home';
import theme from './theme';

export default class App extends React.PureComponent<{}> {
  public render() {
    return (
      <Web3Provider libraryName="ethers.js" connectors={connectors}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Route exact={true} path="/" component={Home} />
            <Route path="/game/:address" component={Game} />
          </Router>
        </ThemeProvider>
      </Web3Provider>
    );
  }
}
