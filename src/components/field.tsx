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
import { range } from 'ramda';
import theme from '../theme';
import FieldItem from './fieldItem';

type Props = {
  size: number;
  trailingVHeader?: boolean;
  onItemPress?: (x: number, y: number) => void;
} & WithStyles<typeof styles>;

class Field extends React.PureComponent<Props> {

  render() {
    const n = range(1, this.props.size + 1);

    return (
      <Paper className={this.props.classes.paper}>
        <Table>
          <TableHead>
            <TableRow>
              { !this.props.trailingVHeader && 
                <TableCell
                  key='x'
                  align='center'
                  padding='none'
                ></TableCell>
              }
              {
                n.map(v => <TableCell key={v} align='center' padding='none'>{Field.numToSSColumn(v)}</TableCell>)
              }
              { this.props.trailingVHeader && 
                <TableCell
                  key='x'
                  align='center'
                  padding='none'
                ></TableCell>
              }
            </TableRow>
          </TableHead>
          <TableBody>
            {n.map(i => this.renderRow(n, i))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  private renderRow = (n: number[], y: number) => {
    return (
      <TableRow key={y} hover={true}>
        { !this.props.trailingVHeader &&
          <TableCell component="th" scope="row" padding='none' align='center'>
            {y}
          </TableCell>
        }
        { n.map((x) => this.renderCell(x, y))}
        { this.props.trailingVHeader &&
          <TableCell component="th" scope="row" padding='none' align='center'>
            {y}
          </TableCell>
        }
      </TableRow>
    );
  }

  private renderCell = (x: number, y: number) => {

    const handlePress = () => {
      if (this.props.onItemPress) {
        this.props.onItemPress(x, y)
      }
    };

    return (
      <TableCell
        key={x}
        align='center'
        padding='none'
      >
        <FieldItem onClick={handlePress}/>
        {/*<Box color='primary'>x</Box>*/}
      </TableCell>
    );
  }

  public static numToSSColumn(num: number): string {
    let s = '', t;

    while (num > 0) {
      t = (num - 1) % 26;
      s = String.fromCharCode(65 + t) + s;
      num = (num - t)/26 | 0;
    }
    return s || undefined;
  }
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

