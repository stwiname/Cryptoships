import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { withStyles, WithStyles } from '@material-ui/styles';
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
} & WithStyles<typeof styles>;

const Field: React.FunctionComponent<Props> = props => {
  const game = Game.useContainer();
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
      <TableCell key={x} align="center" padding="none">
        <FieldItem onClick={handlePress} result={result} />
      </TableCell>
    );
  };

  const renderRow = (xs: number[], y: number) => {
    return (
      <TableRow key={y} hover={true}>
        {!props.trailingVHeader && (
          <TableCell component="th" scope="row" padding="none" align="center">
            {y}
          </TableCell>
        )}
        {xs.map(x => renderCell(x, y))}
        {props.trailingVHeader && (
          <TableCell component="th" scope="row" padding="none" align="center">
            {y}
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <Paper className={props.classes.paper}>
      <Table>
        <TableHead>
          <TableRow>
            {!props.trailingVHeader && (
              <TableCell key="x" align="center" padding="none" />
            )}
            {n.map(v => (
              <TableCell key={v} align="center" padding="none">
                {numToBase64(v)}
              </TableCell>
            ))}
            {props.trailingVHeader && (
              <TableCell key="x" align="center" padding="none" />
            )}
          </TableRow>
        </TableHead>
        <TableBody>{n.map(i => renderRow(n, i))}</TableBody>
      </Table>
    </Paper>
  );
};

const styles = {
  paper: {
    margin: theme.spacing(3),
    width: '50%',
    // overflowX: 'auto',
    marginBottom: theme.spacing(2),
  },
};

export default withStyles(styles)(Field);
