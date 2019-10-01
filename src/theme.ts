import { blue, blueGrey, red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

export default createMuiTheme({
  palette: {
    type: 'dark',
    primary: blue,
    secondary: blueGrey,
    tertiary: { backgroundColor: '#ff1744' },
  },
  overrides: {
    MuiTableCell: {
      root: {
        border: '1px solid rgb(224, 224, 224)',
      },
    },
  },
});
