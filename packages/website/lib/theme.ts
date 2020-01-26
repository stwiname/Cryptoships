import * as createPalette from '@material-ui/core/styles/createPalette';
declare module '@material-ui/core/styles/createPalette' {
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
  }
  interface Palette {
    tertiary: PaletteColor;
  }
}

import { createMuiTheme, makeStyles } from '@material-ui/core/styles';

const lightBlue = '#43F3F3'; // Blue
const darkBlue = '#0071e5';
const darkestBlue= '#140034'; // Background
const pink = '#F705FC'; // Pink
const yellow = '#F6EE15'; // Yellow

const background = `linear-gradient(to top, ${darkestBlue}, black)`;

export default createMuiTheme({
  palette: {
    type: 'dark',
    // TODO do dark and light colors
    primary: {
      light: lightBlue,
      main: lightBlue,
      dark: "#0071e5",
    },
    secondary: {
      light: pink,
      main: pink,
      dark: pink,
    },
    tertiary: {
      light: yellow,
      main: yellow,
      dark: yellow,
    },
  }, // Allows us to add tertiary color
  overrides: {
    MuiCard: {
      root: {
        backgroundImage: background
      }
    },
    MuiDialog: {
      paper: {
        backgroundImage: background,
        border: `2px solid ${darkBlue}`,
      }
    },
    MuiDialogTitle: {
      root: {
        color: lightBlue
      }
    },
    MuiTypography: {
      h5: {
        color: yellow
      }
    },
    MuiContainer: {
      root: {
        backgroundImage: `linear-gradient(to top, ${yellow}, ${pink}, ${darkBlue} 50%, ${darkestBlue})`
      }
    }
  }
});


export const useThemeStyles = makeStyles(theme => ({
  border: {
    border: `2px solid ${lightBlue}`,
  },
  borderAlt: {
    border: `2px solid ${pink}`,
  },
  cell: {
    border: `2px solid ${lightBlue}`,
  },
  cellAlt: {
    border: `2px solid ${pink}`,
  },
  button: {
    color: `${yellow} !important`,
    backgroundImage: `linear-gradient(to right, ${pink}, ${lightBlue})`
  },
}));