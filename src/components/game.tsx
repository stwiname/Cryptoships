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

  const renderTeam = (team: Team, container: any) => {
    return (
      <Grid key={team} item xs={6}>
        <Auction container={container}/>
        <Field
          team={team}
          onItemPress={handleGridPress(team)}
          container={container}
        />
      </Grid>
    );
  }

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
          { renderTeam(Team.red, RedAuctionContainer) }
          { renderTeam(Team.blue, BlueAuctionContainer) }
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