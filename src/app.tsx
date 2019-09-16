import * as React from 'react';
import Web3Provider from 'web3-react';
import connectors from './connectors';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Field from './components/field';
import Game from './routes/game';
import Home from './routes/home';

export default class App extends React.PureComponent<{}> {
  render() {
    return (
      <Web3Provider
        libraryName='ethers.js'
        connectors={connectors}
      >
        <Router>
          <Route exact path='/' component={Home}/>
          <Route path='/game/:address' component={Game}/>
        </Router>
      </Web3Provider>
    );
  }
}
