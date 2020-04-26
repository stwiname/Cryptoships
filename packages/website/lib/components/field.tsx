import Box from '@material-ui/core/Box';
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
import { Game } from '../containers';
import theme, { useThemeStyles } from '../theme';
import { movesEqual, numToBase64 } from '../utils';
import FieldItem from './fieldItem';
import clsx from 'clsx';

type Props = {
  team: Team;
  container: any;
  trailingVHeader?: boolean;
  onItemPress?: (
    x: number,
    y: number,
    result?: FieldStates,
    address?: string
  ) => void;
};

const HEADER_HEIGHT = 2;
const HEADER_WIDTH = 5;

const useStyles = makeStyles<Theme, { dimension: number }, 'paper' | 'cell' | 'header'>({
  paper: {
    overflow: 'hidden',
    marginTop: theme.spacing(2),
    borderRadius: '2px'
  },
  cell: {
    minWidth: 50,
    minHeight: 50,
    position: 'relative',
    paddingTop: ({ dimension }) => `${(100-HEADER_WIDTH)/dimension}%`,
    width: ({ dimension }) => `${(100-HEADER_WIDTH)/dimension}%`,
  },
  header: {
    color: theme.palette.tertiary.main,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: () => `${HEADER_HEIGHT}%`, // Keep these as a function, hack to fix css ordering
    width: () => `${HEADER_WIDTH}%`, // Keep these as a function, hack to fix css ordering
  }
});

const Cell: React.FunctionComponent<TableCellProps & { className?: any }> = props => {
  return (
    <TableCell
      align="center"
      padding="none"
      {...props}
      className={props.className}
    >
      {props.children}
    </TableCell>
  );
};

const Field: React.FunctionComponent<Props> = props => {
  const game = Game.useContainer();
  const classes = useStyles({ dimension: game.fieldSize });
  const themeClasses = useThemeStyles({});
  const auction = props.container.useContainer();
  const n = range(0, game.fieldSize);
  const isRedTeam = Team[auction.team] === Team[Team.red];
  const cellClass = isRedTeam ? themeClasses.cellAlt : themeClasses.cell;

  const headerClass = clsx(classes.header, classes.cell, cellClass);

  const renderCell = (x: number, y: number) => {
    // For display perposes the numbers start at 0
    const auctionResults = game.getTeamAuctionResults(props.team);

    const {
      result,
      address,
    }: { result: FieldStates; address?: string } =
      find(m => movesEqual(m.move, [x, y]), auctionResults) ||
      (
        auction.pendingBid &&
        movesEqual(auction.pendingBid.move, [x, y])
      ) && { result: 'aiming', address: null } ||
      (
        auction.leadingBid &&
        movesEqual(auction.leadingBid.move, [x, y]) &&
        !auction.leadingBid.amount.isZero()
      ) &&
      { result: null, address: auction.leadingBid.bidder } ||
      { result: 'unplayed', }

    const handlePress = () => {
      if (props.onItemPress) {
        props.onItemPress(x, y, result, address);
      }
    };

    return (
      <Cell key={x} className={clsx(classes.cell, cellClass)}>
        <FieldItem onClick={handlePress} result={result} />
      </Cell>
    );
  };

  const renderRow = (xs: number[], y: number) => {
    return (
      <TableRow key={y} hover={true}>
        {!props.trailingVHeader && (
          <Cell
            component="th"
            scope="row"
            className={headerClass}
          >
            {y + 1}
          </Cell>
        )}
        {xs.map(x => renderCell(x, y))}
        {props.trailingVHeader && (
          <Cell
            component="th"
            scope="row"
            className={headerClass}
          >
            {y + 1}
          </Cell>
        )}
      </TableRow>
    );
  };

  return (
      <div style={{overflowX: 'auto'}}>
        <Table
          className={classes.paper}
        >
          <TableHead>
            <TableRow>
              {!props.trailingVHeader && <Cell key="x" className={headerClass}/>}
              {n.map(v => (
                <Cell
                  key={v}
                  className={headerClass}
                >
                  {numToBase64(v + 1)}
                </Cell>
              ))}
              {props.trailingVHeader && <Cell key="x" className={headerClass}/>}
            </TableRow>
          </TableHead>
          <TableBody>{n.map(i => renderRow(n, i))}</TableBody>
        </Table>
      </div>
  );
};

export default Field;
