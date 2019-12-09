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
import theme from '../theme';
import { movesEqual, numToBase64 } from '../utils';
import FieldItem from './fieldItem';

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
    // margin: theme.spacing(3),
    // width: '50%',
    // overflowX: 'auto',
    overflow: 'hidden',
    marginTop: theme.spacing(2),
  },
  cell: {
    width: 50,
    height: 50,
    border: '1px solid',
    borderColor: theme.palette.grey[700]
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
  const n = range(0, game.fieldSize);

  const renderCell = (x: number, y: number) => {
    // For display perposes the numbers start at 0
    const auctionResults = game.getTeamAuctionResults(props.team);
    const {
      result,
      address,
    }: { result: AuctionResult; address?: string } = (!!auction.leadingBid &&
      movesEqual(auction.leadingBid.move, [x, y]) &&
      !auction.hasEnded() &&
      !auction.leadingBid.amount.isZero() && { result: null, address: null }) ||
      find(m => movesEqual(m.move, [x, y]), auctionResults) || {
        result: AuctionResult.unset,
      };

    if (result == null) {
      console.log('NULL RESULT', x, y);
    }

    const handlePress = () => {
      if (props.onItemPress) {
        props.onItemPress(x, y, result, address);
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
            {y + 1}
          </Cell>
        )}
        {xs.map(x => renderCell(x, y))}
        {props.trailingVHeader && (
          <Cell component="th" scope="row">
            {y + 1}
          </Cell>
        )}
      </TableRow>
    );
  };

  return (
    <Box
      className={classes.paper}
      borderColor='grey.700'
      borderRadius={4}
      bgcolor='background.paper'
    >
      <Table>
        <TableHead>
          <TableRow>
            {!props.trailingVHeader && <Cell key="x" />}
            {n.map(v => (
              <Cell key={v}>{numToBase64(v + 1)}</Cell>
            ))}
            {props.trailingVHeader && <Cell key="x" />}
          </TableRow>
        </TableHead>
        <TableBody>{n.map(i => renderRow(n, i))}</TableBody>
      </Table>
    </Box>
  );
};

export default Field;
