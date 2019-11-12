import * as createPalette from '@material-ui/core/styles/createPalette';
declare module '@material-ui/core/styles/createPalette' {
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
  }
  interface Palette {
    tertiary: PaletteColor;
  }
}

import { blue, blueGrey, red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

export default createMuiTheme({
  palette: {
    type: 'dark',
    primary: blue,
    secondary: blueGrey,
    tertiary: {
      light: '#ff4569',
      main: '#ff1744',
      dark: '#b2102f',
    },
  }, // Allows us to add tertiary color
});
