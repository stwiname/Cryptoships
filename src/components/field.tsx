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
import { ThemeProvider, withStyles, WithStyles } from '@material-ui/styles';
import { range } from 'ramda';

import theme from '../theme';
import FieldItem from './fieldItem';

type Props = {
  size: number;
  trailingVHeader?: boolean;
} & WithStyles<typeof styles>;

class Field extends React.PureComponent<Props> {

  render() {
    const n = range(1, this.props.size + 1);

    return (
      <ThemeProvider theme={theme}>
        <Paper className={this.props.classes.paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  key='x'
                  align='center'
                  padding='none'
                ></TableCell>
                {
                  n.map(v => <TableCell key={v} align='center' padding='none'>{this.numToSSColumn(v)}</TableCell>)
                }
              </TableRow>
            </TableHead>
            <TableBody>
              {n.map(i => this.renderRow(n, i))}
            </TableBody>
          </Table>
        </Paper>
      </ThemeProvider>
    );
  }

  private renderRow = (n: number[], index: number) => {
    return (
      <TableRow key={index} hover={true}>
        { !this.props.trailingVHeader &&
          <TableCell component="th" scope="row" padding='none' align='center'>
            {index}
          </TableCell>
        }
        { n.map(this.renderCell)}
        { this.props.trailingVHeader &&
          <TableCell component="th" scope="row" padding='none' align='center'>
            {index}
          </TableCell>
        }
      </TableRow>
    );
  }

  private renderCell = (index: number) => {
    return (
      <TableCell
        key={index}
        align='center'
        padding='none'
      >
        {/*<FieldItem/>*/}
        <Box color='primary'>x</Box>
      </TableCell>
    );
  }

  private numToSSColumn(num: number): string {
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

