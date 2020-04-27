import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { makeStyles } from '@material-ui/core/styles';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { AuctionResult, Team, MEDIA_QUERY_COND, FieldStates } from '../contracts';
import { Auction, Field, Loading } from '../components';
import Winnings from './winnings';
import PlaceBid, { Props as PlaceBidProps } from '../components/placeBid';
import PlacedMove, { Props as PlacedMoveProps } from '../components/placedMove';
import { createAuctionContainer, Game as Container} from '../containers';
import theme, { useThemeStyles } from '../theme';
import { numToBase64, createRadial } from '../utils';
import clsx from 'clsx';
import NotFound from '../routes/notFound';

const useStyles = makeStyles<Theme>({
  cardMobile: {
    paddingLeft: 0,
    paddingRight: 0, paddingBottom: 0
  },
  redSelected: {
    background: createRadial(theme.palette.secondary.main, 0.2, 0.1),
  },
  blueSelected: {
    background: createRadial(theme.palette.primary.main, 0.2, 0.1),
  }
})

type Props = {
  team?: Team;
  setTeam: (team: Team) => void;
};

const AuctionContainers: Record<Team, any> = {
  [Team.red]: createAuctionContainer(),
  [Team.blue]: createAuctionContainer()
};

const Game: React.FunctionComponent<Props> = props => {
  const game = Container.useContainer();
  const classes = useThemeStyles({});
  const tabClasses = useStyles({});
  const largeLayout = useMediaQuery(MEDIA_QUERY_COND);

  const [dialogParams, setDialogParams] = React.useState<
    Pick<PlaceBidProps, 'team' | 'position'>
  >(null);

  const [dialogParamsPlaced, setDialogParamsPlaced] = React.useState<
    Omit<PlacedMoveProps, 'open' | 'onClose'>
  >(null);

  const handleGridPress = (team: Team) => (
    x: number,
    y: number,
    result: FieldStates,
    address?: string
  ) => {
    switch (result) {
      case 'aiming':
        break;
      case 'unplayed':
        setDialogParams({ team, position: { x, y } });
        break;
      default:
        setDialogParamsPlaced({ result, address });
        break;
    }
  };

  if (game.loading) {
    return <Loading/>;
  }

  if (game.error?.message.includes('contract not deployed')) {
    return <NotFound
      subTitle='Check that you have the right network'
      hideHomeButton={true}
    />
  }

  const closeDialog = () => setDialogParams(null);
  const closeDialogPlaced = () => setDialogParamsPlaced(null);

  const renderTeam = (team: Team, xs=6) => {
    return (
      <Grid key={team} item={true} xs={xs as any} style={{ maxWidth: 800 }}>
        <Card style={{ marginBottom: 16 }}>
          <CardContent className={clsx(!largeLayout && tabClasses.cardMobile)}>
            <Auction container={AuctionContainers[team]} />
            <Winnings team={team}/>
            <Field
              team={team}
              onItemPress={handleGridPress(team)}
              container={AuctionContainers[team]}
            />
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderTab = (index: number) => {
    switch (index) {
      case 0:
        return renderTeam(Team.red, 12);
      case 1:
        return renderTeam(Team.blue, 12);
      default:
        return null;
    }
  }

  const renderSmallScreen = (): any => {
    const selectedTab = props.team == Team.blue ? 1 : 0;

    return <Box alignItems="center" flexDirection='column' pt={2} style={{ maxWidth: 800}}>
      <ButtonGroup
        color="primary"
        aria-label="outlined primary button group"
        size='large'
        fullWidth
      >
        <Button
          color='secondary'
          onClick={(e) => props.setTeam(Team.red)}
          style={{ borderWidth: '2px' }}
          className={selectedTab === 0 && clsx(tabClasses.redSelected)}
        >
          Red Team
        </Button>
        <Button
          onClick={(e) => props.setTeam(Team.blue)}
          style={{borderWidth: '2px'}}
          className={selectedTab === 1 && clsx(tabClasses.blueSelected)}
        >
          Blue Team
        </Button>
      </ButtonGroup>
      {renderTab(selectedTab)}
    </Box>;
  };

  const renderLargeScreen = () => {
    return <Grid container={true} direction="row" spacing={2} justify="center" style={{ maxWidth: 1400}}>
      {renderTeam(Team.red)}
      {renderTeam(Team.blue)}
    </Grid>;
  }

  const RedProvider = AuctionContainers[Team.red].Provider;
  const BlueProvider = AuctionContainers[Team.blue].Provider;

  return (
    <RedProvider initialState={{ team: Team.red }}>
      <BlueProvider initialState={{ team: Team.blue }}>
        <Box display='flex' justifyContent='center' width='100%'>
          {largeLayout ? renderLargeScreen() : renderSmallScreen()}
        </Box>
        <PlaceBid
          {...dialogParams}
          auctionContainer={
            dialogParams && AuctionContainers[dialogParams.team]
          }
          onClose={closeDialog}
        />
        <PlacedMove {...dialogParamsPlaced} onClose={closeDialogPlaced} />
      </BlueProvider>
    </RedProvider>
  );
};

export default Game;
