import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import capitalize from '@material-ui/core/utils/capitalize';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useWeb3React } from '@web3-react/core';
import * as React from 'react';
import { Team, GameResult } from '../contracts';
import { moveToString } from '../utils';
import { utils } from 'ethers';
import Countdown from './countdown';
import { path } from 'ramda';
import { Game } from '../containers';
import { useThemeStyles } from '../theme';
import clsx from 'clsx';

type Props = {
  container: any;
};

const Auction: React.FunctionComponent<Props> = (props: Props) => {
  const auction = props.container.useContainer();
  const game = Game.useContainer();
  const { account } = useWeb3React();
  const classes = useThemeStyles({});
  const isRedTeam = Team[auction.team] === Team[Team.red];

  const renderNewAuction = () => {
    const isRunning = !!auction && auction.hasStarted() && !auction.hasEnded();
    const hasMove = auction.leadingBid && !auction.leadingBid.amount.isZero();

    const amount: utils.BigNumber = (isRunning && path(['leadingBid', 'amount'], auction) || new utils.BigNumber(0));
    const hasWon = GameResult[game.result] === GameResult[isRedTeam ? GameResult.redWinner : GameResult.blueWinner];
    const hasLost = GameResult[game.result] === GameResult[isRedTeam ? GameResult.blueWinner : GameResult.redWinner];

    const gameCompleted = hasWon || hasLost;

    const getTitle = () => {

      if (hasWon) {
        return 'Winner';
      }

      if (hasLost) {
        return 'Loser';
      }

      if (isRunning) {
        return hasMove
          ? moveToString(
              auction.leadingBid.move[0],
              auction.leadingBid.move[1]
            )
          : 'Make a move';
      }

      return !!auction && (auction.hasEnded() || !auction.startTime)
        ? 'Waiting'
        : 'XX';
    }

    const getSubtitle = () => {
      if (hasWon) {
        return 'Congratulations';
      }

      if (hasLost) {
        return 'Better luck next time';
      }

      if (isRunning) {
        return hasMove
          ? account === auction.leadingBid.bidder
            ? 'You are leading'
            : auction.leadingBid.bidder
          : 'This teams turn';
      }

      return !!auction && auction.startTime && Date.now() < auction.startTime.getTime()
        ? 'Starting soon'
        : 'Other teams turn';
    }

    return <Box>
      <Box flexDirection='row' display='flex' justifyContent='space-between'>
        <Box>
          <Typography variant='h2' color='primary'>
            <Box fontWeight={400}>
              {getTitle()}
            </Box>
          </Typography>
          {
            !gameCompleted &&
            <Typography variant='h5'>
              {`${utils.formatEther(amount)} ETH`}
            </Typography>
          }
        </Box>
        {
          !!auction && !auction.hasEnded() &&
          <Countdown
            endTime={auction.endTime || auction.startTime}
            duration={auction.endTime ? auction.duration : auction.duration/2}
          />
        }
      </Box>
      <Typography variant='subtitle1' color='secondary'>
        {getSubtitle()}
      </Typography>
    </Box>
  }

  return (
    <Card className={clsx(isRedTeam ? classes.borderAlt : classes.border)}>
      <CardContent>
        {renderNewAuction()}
      </CardContent>
    </Card>
  );
};

export default Auction;
