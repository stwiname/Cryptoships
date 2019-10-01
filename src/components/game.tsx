import { Grid, Typography } from '@material-ui/core';
import * as React from 'react';
import { Team } from '../../lib/contracts';
import { Auction, Field } from '../components';
import PlaceBid, { Props as PlaceBidProps } from '../components/placeBid';
import { createAuctionContainer, Game as Container } from '../containers';

type Props = {};

const RedAuctionContainer = createAuctionContainer();
const BlueAuctionContainer = createAuctionContainer();

const Game: React.FunctionComponent<Props> = props => {
  const game = Container.useContainer();

  const [dialogParams, setDialogParams] = React.useState<
    Pick<PlaceBidProps, 'team' | 'position'>
  >(null);

  const handleGridPress = (team: Team) => (x: number, y: number) => {
    setDialogParams({ team, position: { x, y } });
  };

  const closeDialog = () => setDialogParams(null);

  const renderTeam = (team: Team, container: any) => {
    return (
      <Grid key={team} item={true} xs={6}>
        <Auction container={container} />
        <Field
          team={team}
          onItemPress={handleGridPress(team)}
          container={container}
        />
      </Grid>
    );
  };

  return (
    <RedAuctionContainer.Provider initialState={Team.red}>
      <BlueAuctionContainer.Provider initialState={Team.blue}>
        <Typography variant="h4">GAME</Typography>
        <Grid container={true} direction="row" spacing={2} justify="center">
          {renderTeam(Team.red, RedAuctionContainer)}
          {renderTeam(Team.blue, BlueAuctionContainer)}
        </Grid>
        {dialogParams && (
          <PlaceBid
            {...dialogParams}
            auctionContainer={
              Team[dialogParams.team] === Team[Team.red]
                ? RedAuctionContainer
                : BlueAuctionContainer
            }
            onClose={closeDialog}
          />
        )}
      </BlueAuctionContainer.Provider>
    </RedAuctionContainer.Provider>
  );
};

export default Game;
