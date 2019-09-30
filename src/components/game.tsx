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
    <RedAuctionContainer.Provider initialState={Team.red}>
      <BlueAuctionContainer.Provider initialState={Team.blue}>
        <Typography variant='h4'>GAME</Typography>
        <Grid
          container
          direction='row'
          spacing={2}
          justify='center'
        >
          <Grid key='red' item xs={6}>
            <Auction container={RedAuctionContainer}/>
          </Grid>
          <Grid key='blue' item xs={6}>
            <Auction container={BlueAuctionContainer}/>
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
              container={RedAuctionContainer}
            />
          </Grid>
          <Grid key='blue' item xs={6}>
            <Field
              team={Team.blue}
              trailingVHeader
              onItemPress={handleGridPress(Team.blue)}
              container={BlueAuctionContainer}
            />
          </Grid>
        </Grid>
        { dialogParams &&
          <PlaceBid
            {...dialogParams}
            auctionContainer={
              Team[dialogParams.team] === Team[Team.red]
                ? RedAuctionContainer
                : BlueAuctionContainer
              }
            onClose={closeDialog}
          />
        }
      </BlueAuctionContainer.Provider>
    </RedAuctionContainer.Provider>
  );
}

export default Game;