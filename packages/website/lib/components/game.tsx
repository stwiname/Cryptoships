import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { AuctionResult, Team } from '../contracts';
import { Auction, Field } from '../components';
import PlaceBid, { Props as PlaceBidProps } from '../components/placeBid';
import PlacedMove, { Props as PlacedMoveProps } from '../components/placedMove';
import { createAuctionContainer, Game as Container } from '../containers';
import theme, { useThemeStyles } from '../theme';
import { numToBase64 } from '../utils';
import clsx from 'clsx';
import { ReactSVG as SVG } from 'react-svg';
// import logo from '../../assets/cryptoships_wording_1.svg';

const logo =require('../../assets/cryptoships_wording_1.svg');

type Props = {};

const RedAuctionContainer = createAuctionContainer();
const BlueAuctionContainer = createAuctionContainer();

const Game: React.FunctionComponent<Props> = props => {
  const game = Container.useContainer();
  const classes = useThemeStyles({});

  const [dialogParams, setDialogParams] = React.useState<
    Pick<PlaceBidProps, 'team' | 'position'>
  >(null);

  const [dialogParamsPlaced, setDialogParamsPlaced] = React.useState<
    Omit<PlacedMoveProps, 'open' | 'onClose'>
  >(null);

  const handleGridPress = (team: Team) => (
    x: number,
    y: number,
    result: AuctionResult,
    address?: string
  ) => {
    if (result || result !== AuctionResult.unset) {
      setDialogParamsPlaced({ result, address });
    } else {
      setDialogParams({ team, position: { x, y } });
    }
    // setDialogParamsNew({
    //   title: `Place bid for ${Team[team] || ''} team`,
    //   renderContent: () => <Typography>Test</Typography>
    // });
  };

  const closeDialog = () => setDialogParams(null);
  const closeDialogPlaced = () => setDialogParamsPlaced(null);

  const renderTeam = (team: Team, container: any) => {
    return (
      <Grid key={team} item={true} xs={6}>
        <Card>
          <CardContent>
            <Auction container={container} />
            <Field
              team={team}
              onItemPress={handleGridPress(team)}
              container={container}
            />
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <RedAuctionContainer.Provider initialState={{ team: Team.red }}>
      <BlueAuctionContainer.Provider initialState={{ team: Team.blue }}>
        <SVG
          src='../../assets/cryptoships_wording_3.svg'
          renumerateIRIElements={false}
          beforeInjection={svg => {
            svg.classList.add('svg-class-name')
            svg.setAttribute('style', 'height: 100px; width: 100%; padding-top: 10px;')
          }}
        />
        {/*<Typography variant="h4">Battleship</Typography>*/}
        <Grid container={true} direction="row" spacing={2} justify="center">
          {renderTeam(Team.red, RedAuctionContainer)}
          {renderTeam(Team.blue, BlueAuctionContainer)}
        </Grid>
        <PlaceBid
          {...dialogParams}
          auctionContainer={
            dialogParams && Team[dialogParams.team] === Team[Team.red]
              ? RedAuctionContainer
              : BlueAuctionContainer
          }
          onClose={closeDialog}
        />
        <PlacedMove {...dialogParamsPlaced} onClose={closeDialogPlaced} />
      </BlueAuctionContainer.Provider>
    </RedAuctionContainer.Provider>
  );
};

export default Game;
