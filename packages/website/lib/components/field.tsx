import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell, { TableCellProps } from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import find from 'ramda/src/find';
import range from 'ramda/src/range';
import * as React from 'react';
import { AuctionResult, Team } from '../contracts';
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
    result?: AuctionResult,
    address?: string
  ) => void;
};

const useStyles = makeStyles({
  paper: {
    overflow: 'hidden',
    marginTop: theme.spacing(2),
    borderRadius: '2px'
  },
  cell: {
    width: 50,
    height: 50,
    minWidth: 50,
    minHeight: 50,
  },
  header: {
    color: theme.palette.tertiary.main,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  }
});

const Cell: React.FunctionComponent<TableCellProps & { className?: any }> = props => {
  const classes = useStyles({});
  return (
    <TableCell
      align="center"
      padding="none"
      {...props}
      className={clsx(classes.cell, props.className)}
    >
      {props.children}
    </TableCell>
  );
};

const Field: React.FunctionComponent<Props> = props => {
  const game = Game.useContainer();
  const classes = useStyles({});
  const themeClasses = useThemeStyles({});
  const auction = props.container.useContainer();
  const n = range(0, game.fieldSize);
  const isRedTeam = Team[auction.team] === Team[Team.red];
  const cellClass = isRedTeam ? themeClasses.cellAlt : themeClasses.cell;

  const renderCell = (x: number, y: number) => {
    // For display perposes the numbers start at 0
    const auctionResults = game.getTeamAuctionResults(props.team);

    const {
      result,
      address,
    }: { result: AuctionResult; address?: string } =
      find(m => movesEqual(m.move, [x, y]), auctionResults) ||
      (
        auction.leadingBid &&
        movesEqual(auction.leadingBid.move, [x, y]) &&
        !auction.leadingBid.amount.isZero() ||
        auction.pendingBid &&
        movesEqual(auction.pendingBid.move, [x, y])
      ) &&
      { result: null, address: null } ||
      { result: AuctionResult.unset, }

    const handlePress = () => {
      if (props.onItemPress) {
        props.onItemPress(x, y, result, address);
      }
    };

    return (
      <Cell key={x} className={cellClass}>
        <FieldItem onClick={handlePress} result={result} />
      </Cell>
    );
  };

  const renderRow = (xs: number[], y: number) => {
    return (
      <TableRow key={y} hover={true}>
        {!props.trailingVHeader && (
          <Cell component="th" scope="row" className={clsx(cellClass, classes.header)}>
            {y + 1}
          </Cell>
        )}
        {xs.map(x => renderCell(x, y))}
        {props.trailingVHeader && (
          <Cell component="th" scope="row" className={clsx(cellClass, classes.header)}>
            {y + 1}
          </Cell>
        )}
      </TableRow>
    );
  };

  return (
      <Table className={clsx(classes.paper, isRedTeam ? themeClasses.borderAlt : themeClasses.border)}>
        <TableHead>
          <TableRow>
            {!props.trailingVHeader && <Cell key="x" className={classes.header}/>}
            {n.map(v => (
              <Cell key={v} className={clsx(cellClass, classes.header)}>
                {numToBase64(v + 1)}
              </Cell>
            ))}
            {props.trailingVHeader && <Cell key="x" />}
          </TableRow>
        </TableHead>
        <TableBody>{n.map(i => renderRow(n, i))}</TableBody>
      </Table>
  );
};

export default Field;
