import { createMuiTheme } from '@material-ui/core/styles';
import { blue, blueGrey, red } from '@material-ui/core/colors';

export default createMuiTheme({
  palette: {
    primary: blue,
    secondary: blueGrey,
    tertiary: { backgroundColor: '#ff1744' },
  },
  overrides: {
    MuiTableCell: {
      root: {
        border: '1px solid rgb(224, 224, 224)',
      }
    }
  }
});