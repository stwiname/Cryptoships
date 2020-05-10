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
const darkestBlue = '#261447'; // Background
const darkPink = '#FF3864';
const pink = '#F706CF'; // Pink
const purple = '#7200FC';
const yellow = '#F9C80E'; // Yellow
const orange = '#FF6C11';
const red = '#fd1d52';
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
      },
      body1: {
        color: yellow
      }
    },
    MuiContainer: {
      root: {
        height: '100%',
        // backgroundImage: `linear-gradient(to top, ${orange}, ${purple}, ${darkestBlue}, ${nearBlack} 60%)`,
        // backgroundAttachment: 'fixed',
      }
    },
    MuiCardContent: {
      root: {
        "&:last-child": {
          paddingBottom: null
        },
      }
    },
    MuiDialogContentText: {
      root: {
        color: yellow,
      }
    },
    MuiButton: {
      contained: {
        fontFamily: "'Permanent Marker', cursive",
        fontSize: 'large',
        lineHeight: 1.43,
        color: `${red} !important`,
        backgroundImage: `linear-gradient(0deg, rgba(255,114,232,1) 0%, rgba(115,0,252,1) 25%, rgba(58,0,126,1) 50%, rgba(254,168,251,1) 51%, rgba(2,117,229,1) 95%, rgba(2,117,229,1) 100%);`
      }
    },
    MuiTableCell: {
      root: {
        borderBottom: undefined,
      }
    }
  }
});

export const useThemeStyles = makeStyles(theme => ({
  yellow: {
    color: yellow
  },
  border: {
    border: `2px solid ${lightBlue}`,
  },
  borderAlt: {
    border: `2px solid ${pink}`,
  },
  cell: {
    borderColor: lightBlue,
    borderRight: `2px solid ${lightBlue}`,
    borderBottom: `2px solid ${lightBlue}`,
  },
  cellAlt: {
    borderColor: pink,
    borderRight: `2px solid ${pink}`,
    borderBottom: `2px solid ${pink}`,
  },
  comingSoon: {
    fontFamily: "'Permanent Marker', cursive",
    background: `linear-gradient(to top, ${orange}, ${pink})`,
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
  },
  play: {
    textShadow: '-0px 0 1px rgb(30,242,241) , 0px 0 1px rgb(246,5,10)',
    color: 'white',
    '&:hover': {
      textShadow: '-3px 0 1px rgb(30,242,241) , 3px 0 1px rgb(246,5,10)',
    }
  }
}));
