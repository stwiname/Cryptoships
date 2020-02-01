import * as React from 'react';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { utils } from 'ethers';
import { Team } from '../contracts';
import { Winnings as WinningsCont} from '../containers';
import theme, { useThemeStyles } from '../theme';

type Props = {
  team: Team;
}

const useStyles = makeStyles({
  paper: {
    marginTop: theme.spacing(2),
  },
});

const Winnings: React.FunctionComponent<Props> = (props: Props) => {
  const gameWinnings = WinningsCont.useContainer();
  const classes = useThemeStyles({});
  const wClasses = useStyles({});

  const isRedTeam = Team[props.team] === Team[Team.red];

  if (gameWinnings.blueWinnings.isZero() && gameWinnings.redWinnings.isZero()) {
    return null;
  }

  const amount = isRedTeam
    ? gameWinnings.redWinnings
    : gameWinnings.blueWinnings;

  const message = !gameWinnings.winningTeam
    ? `Your potential winnings: ${utils.formatEther(amount)} ETH`
    : Team[gameWinnings.winningTeam] === Team[props.team]
       ? `Congrats! You get ${utils.formatEther(amount)} ETH`
       : `You win nothing`;

  return <Card className={wClasses.paper}>
    <CardContent className={isRedTeam ? classes.borderAlt : classes.border}>
      <Box flexDirection='row' display='flex' justifyContent='space-between'>
        <Typography
          variant='subtitle1'
          style={{ alignSelf: 'center' }}
          className={classes.yellow}
        >
          {message}
        </Typography>

        {
          Team[gameWinnings.winningTeam] === Team[props.team] &&
          <Button
            variant="contained"
            onClick={gameWinnings.withdrawWinnings}
            className={classes.buttonMain}
          >
            Claim!
          </Button>
        }
      </Box>
    </CardContent>
  </Card>;
}

export default Winnings;