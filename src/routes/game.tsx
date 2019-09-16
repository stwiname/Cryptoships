import * as React from 'react';
import { useWeb3Context } from 'web3-react';
import { match } from 'react-router-dom';
import { GameFactory } from '../../types/ethers-contracts/GameFactory';
import { AuctionFactory } from '../../types/ethers-contracts/AuctionFactory';
import { Game as GameInstance } from '../../types/ethers-contracts/Game';
import { Auction as AuctionInstance } from '../../types/ethers-contracts/Auction';
import { Team } from '../../lib/contracts';
import Auction from '../components/auction';

import {Typography, Grid } from '@material-ui/core';

type Props = {
  match: match<{ address: string }>;
}

const Game: React.FunctionComponent<Props> = (props) => {
  const context = useWeb3Context();
  const [gameInstance, setGameInstance] = React.useState<GameInstance>(null);
  const [redAuction, setRedAuction] = React.useState<AuctionInstance>(null);
  const [blueAuction, setBlueAuction] = React.useState<AuctionInstance>(null);


  React.useEffect(() => {
    if (!context.active) {
      context.setFirstValidConnector(['MetaMask'/*, 'Infura'*/])
    }
  }, []);

  React.useEffect(() => {
    if (context.active) {
      try {
        setGameInstance(
          GameFactory.connect(props.match.params.address, context.library)
        );

        getAuctionForTeam(Team.red).then(setRedAuction);
        getAuctionForTeam(Team.blue).then(setBlueAuction);
      }
      catch(e) {
        console.log('Failed to get game instance');
      }
    }
  }, [props.match.params.address]);


  const getAuctionForTeam = async (team: Team) => {
    try {
      if (!gameInstance) {
        return null;
      }

      const auctionAddress = await gameInstance.functions.getCurrentAuction(team);

      if (!auctionAddress) {
        return null;
      }

      return AuctionFactory.connect(auctionAddress, context.library);
    }
    catch(e) {
      // Auction probably doesnt exist for team yet
      return null;
    }
  }


  if (!context.active && !context.error) {
    // loading
    return <div>loading...</div>
  } else if (context.error) {
    return <div>error....</div>
  }

  return <div>
    <Typography variant='h4'>GAME</Typography>
    <Grid
      container
      direction='row'
      spacing={2}
      justify='center'
    >
      <Grid key='red' item xs={6}>
        <Auction team={Team.red} auction={redAuction}/>
      </Grid>
      <Grid key='blue' item xs={6}>
        <Auction team={Team.blue} auction={blueAuction}/>
      </Grid>
    </Grid>
  </div>
}

export default Game;