import Box, { BoxProps } from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell, { TableCellProps } from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import find from 'ramda/src/find';
import range from 'ramda/src/range';
import * as React from 'react';
import { AuctionResult, FieldStates, Team } from '../contracts';
import { Game, Auction as AuctionContainer } from '../containers';
import theme, { useThemeStyles } from '../theme';
import { movesEqual, numToBase64 } from '../utils';
import FieldItem from './fieldItem';
import clsx from 'clsx';

type Props = {
  team: Team;
  container: ReturnType<typeof AuctionContainer>;
  trailingVHeader?: boolean;
  onItemPress?: (
    x: number,
    y: number,
    result?: FieldStates,
    index?: number,
  ) => void;
};

const HEADER_HEIGHT = 2;
const HEADER_WIDTH = 5;
const MIN_WIDTH = 50;
const HEADER_MIN_WIDTH = 30;

const useStyles = makeStyles<Theme, { dimension: number }, 'paper' | 'cell' | 'header' | 'corner' | 'row' | 'headerHoriz' |'headerTitle'>({
  paper: {
    overflow: 'auto',
    marginTop: theme.spacing(2),
    borderRadius: '2px',
  },
  cell: {
    minWidth: MIN_WIDTH,
    minHeight: MIN_WIDTH,
    position: 'relative',
    boxSizing: 'border-box',
    paddingTop: ({ dimension }) => `${(100-HEADER_HEIGHT)/dimension}%`,
    // '&:after': {
    //   content: "",
    //   display: 'block',
    //   paddingTop: '100%',
    // },
    // '&:before': {
    //   content: "",
    //   display: 'table',
    //   paddingTop: '100%',
    // },
  },
  row: {
    "&:hover": {
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    '&>:first-child': {
      borderLeftWidth: `2px`,
      borderLeftStyle: 'solid',
    }
    // "&>:nth-child(2)": {
    //   backgroundColor: 'rgba(255, 255, 255, 0.14)',
    // }
  },
  headerTitle: {
    minWidth: HEADER_MIN_WIDTH,
    color: theme.palette.tertiary.main,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: HEADER_MIN_WIDTH,
    minHeight: HEADER_MIN_WIDTH,
  },
  headerHoriz: {
    borderTopWidth: `2px`,
    borderTopStyle: 'solid',
    minWidth: MIN_WIDTH,
  },
  corner: {
    '&>:first-child': {
      borderTopWidth: `2px`,
      borderTopStyle: 'solid',
    }
  },
});

const Header: React.FunctionComponent<BoxProps> = (props) => {
  return <Box
    display='flex'
    justifyContent='center'
    alignItems='center'
    {...props}
  >
    {props.children}
  </Box>
}

const Field: React.FunctionComponent<Props> = props => {
  const game = Game.useContainer();
  const classes = useStyles({ dimension: game.fieldSize });
  const themeClasses = useThemeStyles({});
  const auction = props.container.useContainer();
  const n = range(0, game.fieldSize);
  const isRedTeam = Team[auction.team] === Team[Team.red];
  const cellClass = isRedTeam ? themeClasses.cellAlt : themeClasses.cell;

  const renderFieldItem = (x: number, y: number) => {
    // For display perposes the numbers start at 0
    const auctionResults = game.auctionResults[props.team] || [];

    const {
      result,
      index,
    }: { result: FieldStates; index?: number } =
      find(m => movesEqual(m.move, [x, y]), auctionResults) ||
      (
        auction.pendingBid &&
        movesEqual(auction.pendingBid.move, [x, y])
      ) && { result: 'aiming', index: auction.index } ||
      (
        auction?.auction?.leadingBid &&
        movesEqual(auction.auction.leadingBid.move, [x, y]) &&
        !auction.auction.leadingBid.amount.isZero()
      ) &&
      { result: null, index: auction.index } ||
      { result: 'unplayed', }

    const handlePress = () => {
      if (props.onItemPress) {
        props.onItemPress(x, y, result, index);
      }
    };

    return <FieldItem onClick={handlePress} result={result} />;
  }

  const renderHorizHeader = (x: number) => {
    return <Header
      flexGrow={1}
      className={clsx(cellClass, classes.header, classes.headerHoriz)}
      key={`x${x}`}
    >
      <Box className={classes.headerTitle} textAlign='center'>
        {numToBase64(x + 1)}
      </Box>
    </Header>;
  }

  const renderVertHeader = (y?: number) => {
    return <Header className={clsx(cellClass, classes.header)} key={`y${y}`}>
      <Box className={classes.headerTitle} textAlign='center'>
        {y !== undefined && y + 1 }
      </Box>
    </Header>;
  }

  const renderCell = (x: number, y: number) => {
    return <Box
      display='flex'
      flexGrow={1}
      className={clsx(classes.cell, cellClass)}
      key={`${x}${y}`}
    >
      {renderFieldItem(x, y)}
    </Box>
  }

  const renderRow = (y: number) => {
    return <Box display='flex' flexDirection='row' className={classes.row} key={y}>
      {renderVertHeader(y)}
      {n.map(x => renderCell(x, y))}
    </Box>
  }

  return (
    <Box display='flex' flexDirection='column' className={classes.paper}>
      <Box display='flex' flexDirection='row' className={clsx(classes.row, classes.corner)}>
        {renderVertHeader()}
        {n.map(renderHorizHeader)}
      </Box>
      {
        n.map(renderRow)
      }
    </Box>
  );
};

export default Field;
