import {
  Box,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import TableCell, { TableCellProps } from '@material-ui/core/TableCell';
import { find, range } from 'ramda';
import * as React from 'react';
import { AuctionResult, Team } from '../../lib/contracts';
import { Game } from '../containers';
import theme from '../theme';
import { movesEqual, numToBase64 } from '../utils';
import FieldItem from './fieldItem';

type Props = {
  team: Team;
  container: any;
  trailingVHeader?: boolean;
  onItemPress?: (x: number, y: number) => void;
};

const useStyles = makeStyles({
  paper: {
    margin: theme.spacing(3),
    // width: '50%',
    // overflowX: 'auto',
    marginBottom: theme.spacing(2),
  },
  cell: {
    width: 50,
    height: 50,
    border: '3px solid white',
  },
});

const Cell: React.FunctionComponent<TableCellProps> = props => {
  const classes = useStyles({});
  return (
    <TableCell
      align="center"
      padding="none"
      className={classes.cell}
      {...props}
    >
      {props.children}
    </TableCell>
  );
};

const Field: React.FunctionComponent<Props> = props => {
  const game = Game.useContainer();
  const classes = useStyles({});
  const auction = props.container.useContainer();
  const n = range(1, game.fieldSize + 1);

  const renderCell = (x: number, y: number) => {
    const auctionResults = game.getTeamAuctionResults(props.team);
    const { result } = (!!auction.leadingBid &&
      movesEqual(auction.leadingBid.move, [x, y]) &&
      !auction.hasEnded() && { result: null }) ||
      find(m => movesEqual(m.move, [x, y]), auctionResults) || {
        result: AuctionResult.unset,
      };

    const handlePress = () => {
      if (props.onItemPress) {
        props.onItemPress(x, y);
      }
    };

    return (
      <Cell key={x}>
        <FieldItem onClick={handlePress} result={result} />
      </Cell>
    );
  };

  const renderRow = (xs: number[], y: number) => {
    return (
      <TableRow key={y} hover={true}>
        {!props.trailingVHeader && (
          <Cell component="th" scope="row">
            {y}
          </Cell>
        )}
        {xs.map(x => renderCell(x, y))}
        {props.trailingVHeader && (
          <Cell component="th" scope="row">
            {y}
          </Cell>
        )}
      </TableRow>
    );
  };

  return (
    <Paper className={classes.paper}>
      <Table>
        <TableHead>
          <TableRow>
            {!props.trailingVHeader && <Cell key="x" />}
            {n.map(v => (
              <Cell key={v}>{numToBase64(v)}</Cell>
            ))}
            {props.trailingVHeader && <Cell key="x" />}
          </TableRow>
        </TableHead>
        <TableBody>{n.map(i => renderRow(n, i))}</TableBody>
      </Table>
    </Paper>
  );
};

export default Field;
