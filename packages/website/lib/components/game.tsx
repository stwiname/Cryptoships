import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { Link } from 'react-router-dom';
import * as React from 'react';
import { AuctionResult, Team } from '../contracts';
import { Auction, Field } from '../components';
import Winnings from './winnings';
import PlaceBid, { Props as PlaceBidProps } from '../components/placeBid';
import PlacedMove, { Props as PlacedMoveProps } from '../components/placedMove';
import { createAuctionContainer, Game as Container} from '../containers';
import theme, { useThemeStyles } from '../theme';
import { numToBase64 } from '../utils';
import clsx from 'clsx';
const Logo = require('../../assets/cryptoships_wording_3.svg');

type Props = {};

const RedAuctionContainer = createAuctionContainer();
const BlueAuctionContainer = createAuctionContainer();

const Game: React.FunctionComponent<Props> = props => {
  const game = Container.useContainer();
  const classes = useThemeStyles({});
  const largeLayout = useMediaQuery('(min-width:1200px)');

  const [selectedTab, setTab] = React.useState(0);


  const handleSelectTab = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTab(newValue);
  };

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

  const renderTeam = (team: Team, container: any, xs=6) => {
    return (
      <Grid key={team} item={true} xs={xs as any}>
        <Card>
          <CardContent>
            <Auction container={container} />
            <Winnings team={team}/>
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

  function a11yProps(index: any) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const renderTab = (index: number) => {
    switch (index) {
      case 0:
        return renderTeam(Team.red, RedAuctionContainer, 12);
      case 1:
        return renderTeam(Team.blue, BlueAuctionContainer, 12);
      default:
        // code...
        break;
    }
  }

  const renderSmallScreen = (): any => {
    return <>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleSelectTab} aria-label="simple tabs example">
          <Tab label="Red Team" {...a11yProps(0)} />
          <Tab label="Blue Team" {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      {renderTab(selectedTab)}
    </>;
  };

  const renderLargeScreen = () => {
    return <Grid container={true} direction="row" spacing={2} justify="center">
      {renderTeam(Team.red, RedAuctionContainer)}
      {renderTeam(Team.blue, BlueAuctionContainer)}
    </Grid>;
  }

  return (
    <RedAuctionContainer.Provider initialState={{ team: Team.red }}>
      <BlueAuctionContainer.Provider initialState={{ team: Team.blue }}>
        <Link to='/'>
        <img src={Logo} style={{ height: '100px', width: '100%', paddingTop: '10px' }}/>
        </Link>
        {largeLayout ? renderLargeScreen() : renderSmallScreen()}
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
