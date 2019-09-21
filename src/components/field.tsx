import * as React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box
} from '@material-ui/core';
import { withStyles, WithStyles } from '@material-ui/styles';
import { range, find } from 'ramda';
import theme from '../theme';
import FieldItem from './fieldItem';
import { Game } from '../containers';
import { Team, AuctionResult } from '../../lib/contracts';

type Props = {
  team: Team;
  trailingVHeader?: boolean;
  onItemPress?: (x: number, y: number) => void;
} & WithStyles<typeof styles>;

const Field: React.FunctionComponent<Props> = (props) => {

  const game = Game.useContainer();
  const n = range(1, game.fieldSize + 1);

  const renderCell = (x: number, y: number) => {
    const handlePress = () => {
      if (props.onItemPress) {
        props.onItemPress(x, y)
      }
    };

    const auctionResults = Team[props.team] === Team[Team.red]
      ? game.redAuctionResults
      : game.blueAuctionResults;
    const { result } = find(m => m.move[0] === x && m.move[1] === y, auctionResults)
     || { result: AuctionResult.unset };

    return (
      <TableCell
        key={x}
        align='center'
        padding='none'
      >
        <FieldItem
          onClick={handlePress}
          result={result}
        />
      </TableCell>
    );
  }

  const numToSSColumn = (num: number): string => {
    let s = '', t;

    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      num = (num - t)/26 | 0;
    }
    return s || undefined;
  }

  const renderRow = (n: number[], y: number) => {
    return (
      <TableRow key={y} hover={true}>
        { !props.trailingVHeader &&
          <TableCell component="th" scope="row" padding='none' align='center'>
            {y}
          </TableCell>
        }
        { n.map((x) => renderCell(x, y))}
        { props.trailingVHeader &&
          <TableCell component="th" scope="row" padding='none' align='center'>
            {y}
          </TableCell>
        }
      </TableRow>
    );
  }

  return (
    <Paper className={props.classes.paper}>
      <Table>
        <TableHead>
          <TableRow>
            { !props.trailingVHeader && 
              <TableCell
                key='x'
                align='center'
                padding='none'
              ></TableCell>
            }
            {
              n.map(v => <TableCell key={v} align='center' padding='none'>{numToSSColumn(v)}</TableCell>)
            }
            { props.trailingVHeader && 
              <TableCell
                key='x'
                align='center'
                padding='none'
              ></TableCell>
            }
          </TableRow>
        </TableHead>
        <TableBody>
          {n.map(i => renderRow(n, i))}
        </TableBody>
      </Table>
    </Paper>
  );

}

const styles = {
  paper: {
    margin: theme.spacing(3),
    width: '50%',
    // overflowX: 'auto',
    marginBottom: theme.spacing(2),
  },
};

export default withStyles(styles)(Field);

