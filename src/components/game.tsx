import * as React from 'react';
import{ Game as Container, createAuctionContainer } from '../containers';
import { Auction, Field } from '../components';
import PlaceBid, { Props as PlaceBidProps } from '../components/placeBid';
import { Typography, Grid } from '@material-ui/core';
import { Team } from '../../lib/contracts';

type Props = {

};

const RedAuctionContainer = createAuctionContainer();
const BlueAuctionContainer = createAuctionContainer();

const Game: React.FunctionComponent<Props> = (props) => {
  const game = Container.useContainer();

  const [dialogParams, setDialogParams] = React.useState<Pick<PlaceBidProps, 'team' | 'position'>>(null);


  const handleGridPress = (team: Team) => (x: number, y: number) => {
    setDialogParams({ team, position: { x, y }});
  }

  const closeDialog = () => setDialogParams(null);

  return (
    <div>
      <Typography variant='h4'>GAME</Typography>
      <Grid
        container
        direction='row'
        spacing={2}
        justify='center'
      >
        <Grid key='red' item xs={6}>
          <RedAuctionContainer.Provider initialState={Team.red}>
            <Auction container={RedAuctionContainer}/>
          </RedAuctionContainer.Provider>
        </Grid>
        <Grid key='blue' item xs={6}>
          <BlueAuctionContainer.Provider initialState={Team.blue}>
            <Auction container={BlueAuctionContainer}/>
          </BlueAuctionContainer.Provider>
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
            team={Team.red}
            onItemPress={handleGridPress(Team.red)}
          />
        </Grid>
        <Grid key='blue' item xs={6}>
          <Field
            team={Team.blue}
            trailingVHeader
            onItemPress={handleGridPress(Team.blue)}
          />
        </Grid>
      </Grid>
      { dialogParams &&
        <PlaceBid 
          {...dialogParams}
          onClose={closeDialog}
        />
      }
    </div>
  );
}

export default Game;