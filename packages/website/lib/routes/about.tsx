import * as React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { useThemeStyles } from '../theme';
import { Link } from 'react-router-dom';
import { AuctionResult } from '../contracts';
import FieldItem from '../components/fieldItem';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
const Logo = require('../../assets/cryptoships_wording_3.svg');

type Props = {

}

const About: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});

  const resultToString = (result: AuctionResult | 'aiming') => {
    switch (result) {
      case AuctionResult.unset:
        return 'Untouched';
      case AuctionResult.miss:
        return 'Miss';
      case AuctionResult.hit:
        return 'Hit';
      case "aiming":
        return 'Transaction Submitted';
      default:
        return 'Transaction Confirmed';
    }
  }

  return (
    <Box
      alignItems='center'
      display='flex'
      flexDirection='column'
      height='100vh'
    >
      <Link to='/'>
        <img src={Logo} style={{ height: '200px', width: '100vw', paddingBottom: '50px', paddingTop: '50px' }}/>
      </Link>

      <div style={{ maxWidth: '750px' }}>
        <Card className={themeClasses.border}>
          <CardContent>
            <Typography variant='h3' className={themeClasses.comingSoon}>
              How it works
            </Typography>
            <p>
            <Typography variant='body1'>
              Cryptoships is a modern take on the classic board game Battleships.
              There are a few differences.
            </Typography>
            </p>
            <p>
            <Typography variant='body1'>
              Firstly, you're not playing against another person.
              Anyone can choose to play for either or both teams.
              The "Oracle" has randomly placed the ships for each team, the goal is to be on the team that destroys all the ships first.
            </Typography>
            </p>
            <p>
            <Typography variant='body1'>
              Secondly, each move for each team is an auction.
              To play you bid some amount of ETH along with the move you would like to make.
              The winner of each auction is the user who bid the most ETH.
              Once the first bid is placed a timer starts on the auction, when it ends the "Oracle" confirms whether the move is a hit or a miss.
              When a user gets outbid their ETH gets returned.
            </Typography>
            </p>
            <p>
            <Typography variant='body1'>
               Lastly, you might be wondering where all the ETH from the auctions goes?
               The winning team is in luck, not only do they get their ETH returned from the auctions they won, they also get a share of the losing teams ETH.
               The share is split equally over each move played by the winning team less 10%, this is to cover "Oracle" running costs.
            </Typography>
            </p>
            <p>
              <Typography variant='h6' color='primary' style={{ fontWeight: 700 }}>
                ONCE THE GAME IS OVER YOU MUST COLLECT YOUR WINNINGS BY RETURNING TO THE GAME!
              </Typography>
            </p>
          </CardContent>
        </Card>

        <Box my={2}>
          <Card className={themeClasses.border}>
            <CardContent>
              <Typography variant='h3' className={themeClasses.comingSoon}>
                Field keys
              </Typography>
              <Box mt={2}>
                <Grid container direction='row' alignItems='stretch' justify='space-evenly'>
                  {
                    [AuctionResult.unset, 'aiming', undefined, AuctionResult.miss, AuctionResult.hit]
                      .map((result: AuctionResult | 'aiming', index) => <Grid item xs={2} key={index} style={{ minWidth: '100px'}}>
                          <Grid container justify='center'>
                            <div className={themeClasses.border} style={{ width: '54px', height: '54px', position: 'relative' }}>
                              <FieldItem result={result}/>
                            </div>
                          </Grid>
                          <Typography align='center'>{resultToString(result)}</Typography>
                        </Grid>
                      )
                  }
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </div>
    </Box>
  )

}

export default About;
