import * as React from 'react';
import { useWeb3Context } from 'web3-react';
import { match } from 'react-router-dom';
import { GameFactory } from '../../types/ethers-contracts/GameFactory';
import { AuctionFactory } from '../../types/ethers-contracts/AuctionFactory';
import { Game as GameInstance } from '../../types/ethers-contracts/Game';
import { Auction as AuctionInstance } from '../../types/ethers-contracts/Auction';
import { Team } from '../../lib/contracts';
import Auction from '../components/auction';
import Field from '../components/field';
import PlaceBid, { Props as PlaceBidProps } from '../components/placeBid';
import { utils } from 'ethers';

import {Typography, Grid } from '@material-ui/core';

type Props = {
  match: match<{ address: string }>;
}

const Game: React.FunctionComponent<Props> = (props) => {
  const context = useWeb3Context();
  const [gameInstance, setGameInstance] = React.useState<GameInstance>(null);
  const [redAuction, setRedAuction] = React.useState<AuctionInstance>(null);
  const [blueAuction, setBlueAuction] = React.useState<AuctionInstance>(null);
  const [fieldSize, setFieldSize] = React.useState<number>(1);
  const [dialogParams, setDialogParams] = React.useState<Pick<PlaceBidProps, 'team' | 'position'>>(null);


  React.useEffect(() => {
    if (!context.active) {
      context.setFirstValidConnector(['MetaMask'/*, 'Infura'*/])
    }
  }, []);

  React.useEffect(() => {
    if (context.active) {
      try {
        const game = GameFactory.connect(props.match.params.address, context.library.getSigner(context.account));
        setGameInstance(game);

        getAuctionForTeam(Team.red, game).then(setRedAuction);
        getAuctionForTeam(Team.blue, game).then(setBlueAuction);
        game.functions.fieldSize().then(sizeBN => setFieldSize(sizeBN.toNumber()));
      }
      catch(e) {
        console.log('Failed to get game instance');
      }
    }
  }, [props.match.params.address, context.active]);

  const getAuctionForTeam = async (team: Team, game: GameInstance) => {
    try {
      if (!game) {
        console.log('No game instance');
        return null;
      }

      const auctionAddress = await game.functions.getCurrentAuction(team);

      console.log('Auction address', auctionAddress)
      if (!auctionAddress) {
        return null;
      }

      return AuctionFactory.connect(auctionAddress, context.library.getSigner(context.account));
    }
    catch(e) {
      console.log('Failed to get auction', e);
      // Auction probably doesnt exist for team yet
      return null;
    }
  }

  const handleGridPress = (team: Team) => (x: number, y: number) => {
    setDialogParams({ team, position: { x, y }});
  }

  const closeDialog = () => setDialogParams(null);

  const placeBid = (team: Team, position: { x: number, y: number }, amount: utils.BigNumber) => {
    gameInstance.functions.placeBid(team, [position.x, position.y], { value: amount });
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
    <Grid
      container
      direction='row'
      spacing={2}
      justify='center'
    >
      <Grid key='red' item xs={6}>
        <Field
          size={fieldSize}
          onItemPress={handleGridPress(Team.red)}
        />
      </Grid>
      <Grid key='blue' item xs={6}>
        <Field
          size={fieldSize}
          trailingVHeader
          onItemPress={handleGridPress(Team.blue)}
        />
      </Grid>
    </Grid>
    { dialogParams &&
      <PlaceBid 
        {...dialogParams}
        onClose={closeDialog}
        onSubmit={placeBid}
      />
    }
  </div>
}

export default Game;