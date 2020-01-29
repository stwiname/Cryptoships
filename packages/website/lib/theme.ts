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

const lightBlue = '#2DE2E6'; // Blue
const darkBlue = '#0275E5';
const darkestBlue= '#261447'; // Background
const darkPink = '#FF3864';
const pink = '#F706CF'; // Pink
const purple = '#7200FC';
const yellow = '#F9C80E'; // Yellow
const orange = '#FF6C11';
const nearBlack = '#0D0221';

const background = `linear-gradient(to top, ${darkestBlue}, ${nearBlack})`;

export default createMuiTheme({
  palette: {
    type: 'dark',
    // TODO do dark and light colors
    primary: {
      light: lightBlue,
      main: lightBlue,
      dark: darkBlue,
    },
    secondary: {
      light: pink,
      main: pink,
      dark: darkPink,
    },
    tertiary: {
      light: yellow,
      main: yellow,
      dark: orange,
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
        height: '100vh',
        backgroundImage: `linear-gradient(to top, ${orange}, ${purple}, ${darkestBlue}, ${nearBlack} 60%)`
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
    backgroundImage: `linear-gradient(to right, ${purple}, ${lightBlue})`
  },
  buttonMain: {
    color: `${lightBlue} !important`,
    backgroundImage: `linear-gradient(to right, ${orange}, ${purple})`
  },
  comingSoon: {
    fontFamily: "'Permanent Marker', cursive",
    background: `linear-gradient(to top, ${orange}, ${pink})`,
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
  }
}));