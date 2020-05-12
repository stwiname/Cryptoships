import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import capitalize from '@material-ui/core/utils/capitalize';
import CircularProgress from '@material-ui/core/CircularProgress';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useWeb3React } from '@web3-react/core';
import * as React from 'react';
import { Team, GameResult, AuctionResult, MEDIA_QUERY_COND } from '../contracts';
import { moveToString, bnToDate } from '../utils';
import { utils } from 'ethers';
import Countdown from './countdown';
import { path } from 'ramda';
import { Game, Auction as AuctionContainer } from '../containers';
import { useThemeStyles } from '../theme';
import clsx from 'clsx';

type Props = {
  container: ReturnType<typeof AuctionContainer>;
};

enum AuctionState {
  Unknown,
  NotStarted,
  Started,
  Running, // Started + Has a move
  Leading, // This user is leading the auction
  Confirming, // Don't yet know if hit or miss
  Completed,
  Won,
  Lost,
}

const Auction: React.FunctionComponent<Props> = (props: Props) => {
  const { auction, hasStarted, hasEnded, team } = props.container.useContainer();
  const game = Game.useContainer();
  const { account } = useWeb3React();
  const classes = useThemeStyles({});
  const isRedTeam = Team[team] === Team[Team.red];
  const largeLayout = useMediaQuery(MEDIA_QUERY_COND);

  const [auctionState, setAuctionState] = React.useState<AuctionState>(AuctionState.Unknown);

  React.useEffect(() => {

    setAuctionState(getAuctionState());

    if (!auction) {
      return;
    }

    const timerStart = setTimeout(
      () => setAuctionState(getAuctionState()),
      bnToDate(auction.startTime).getTime() - Date.now()
    );
    const timerEnd = setTimeout(
      () => setAuctionState(getAuctionState()),
      bnToDate(auction.endTime).getTime() - Date.now()
    );

    return () => {
      clearTimeout(timerStart);
      clearTimeout(timerEnd);
    }
  }, [auction]);

  const getAuctionState = (): AuctionState => {
    if(GameResult[game.result] === GameResult[isRedTeam ? GameResult.redWinner : GameResult.blueWinner]) {
      return AuctionState.Won;
    }
    if (GameResult[game.result] === GameResult[isRedTeam ? GameResult.blueWinner : GameResult.redWinner]) {
      return AuctionState.Lost;
    }

    if (hasEnded()) {
      if (auction?.result !== AuctionResult.unset) {
        return AuctionState.Completed;
      }

      return AuctionState.Confirming;
    }

    if (hasStarted()) {
      if (auction?.leadingBid.amount.isZero()) {
        return AuctionState.Started;
      }

      if (auction?.leadingBid.bidder === account) {
        return AuctionState.Leading;
      }

      return AuctionState.Running;
    }

    if (!auction?.startTime.isZero()) {
      return AuctionState.NotStarted;
    }

    console.log("Auction state is unknown", JSON.stringify(auction));

    return AuctionState.Unknown;
  }

  const renderNewAuction = () => {
    const getTitle = () => {
      switch (auctionState) {
        case AuctionState.Won:
          return 'Winner';
        case AuctionState.Lost:
          return 'Loser';
        case AuctionState.Started:
          return 'Make a move';
        case AuctionState.Running:
        case AuctionState.Leading:
          return moveToString(
            auction.leadingBid.move[0],
            auction.leadingBid.move[1]
          );
        case AuctionState.Confirming:
          return 'Other teams turn';
        case AuctionState.Completed:
        case AuctionState.NotStarted:
          return 'Waiting';
        default:
          return 'XX'; // This should never happen
      }
    }

    const getSubtitle = () => {
      switch (auctionState) {
        case AuctionState.Won:
          return 'Congratulations';
        case AuctionState.Lost:
          return 'Better luck next time';
        case AuctionState.Started:
          return 'This teams turn';
        case AuctionState.Running:
          return auction.leadingBid.bidder;
        case AuctionState.Leading:
          return 'You are leading'
        case AuctionState.Confirming:
          return 'Waiting for confirmation';
        case AuctionState.Completed:
          return 'Other teams turn';
        case AuctionState.NotStarted:
          return 'Starting Soon';
        default:
          return 'XX'; // This should never happen
      }
    }

    const displayTimer = auctionState !== AuctionState.Completed && auctionState !== AuctionState.Confirming;
    const countdownTime = hasEnded()
      ? null
      : auction?.endTime.isZero()
        ? bnToDate(auction?.startTime)
        : bnToDate(auction?.endTime)

    const amount = utils.formatEther(
      (auctionState === AuctionState.Running ||
      auctionState === AuctionState.Leading ||
      auctionState === AuctionState.Confirming) &&
      auction?.leadingBid.amount || new utils.BigNumber(0)
    )

    return <Box>
      <Box flexDirection='row' display='flex' justifyContent='space-between'>
        <Box>
          <Typography
            variant='h2'
            color='primary'
            style={{ fontSize: !largeLayout && '7vw', color: '#0275E5', lineHeight: 1.2 }}
            noWrap={true}
          >
            <Box fontWeight={400}>
              {getTitle()}
            </Box>
          </Typography>
          {
            <Typography variant='h5'>
              {`${amount} ETH`}
            </Typography>
          }
        </Box>
        {
          displayTimer &&
          <Countdown
            endTime={countdownTime}
            duration={auction?.duration.toNumber() / (!auction?.endTime.isZero() ? 1 : 2) * 1000}
          />
        }
      </Box>
      <Typography variant='subtitle1' color='secondary' noWrap={true}>
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
