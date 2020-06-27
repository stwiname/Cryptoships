import { green } from '@material-ui/core/colors';
import DialogContentText from '@material-ui/core/DialogContentText';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { utils } from 'ethers';
import path from 'ramda/src/path';
import * as React from 'react';
import { Team } from '../contracts';
import { Game as Container, Auction as AuctionContainer, Connector } from '../containers';
import { moveToString, formatEtherRounded } from '../utils';
import Dialog from './dialog';
import connectors from '../connectors';
import { useWeb3React } from '@web3-react/core';

type Position = {
  x: number;
  y: number;
};

export type Props = {
  team?: Team;
  position?: Position;
  auctionContainer?: ReturnType<typeof AuctionContainer>;
  onClose: () => void;
};

const PlaceBid: React.FunctionComponent<Props> = ({
  onClose,
  team,
  position,
  auctionContainer,
}) => {
  if (!auctionContainer) {
    return null;
  }
  const connector = Connector.useContainer();
  const auction = auctionContainer.useContainer();
  const web3 = useWeb3React();

  const getAuctionAmount = () => utils.formatEther((path(['auction', 'leadingBid', 'amount'], auction) || '0'))

  const [amount, setAmount] = React.useState<string>(getAuctionAmount());
  const [loading, setLoading] = React.useState(false);
  const [auctionRunning, setAuctionRunning] = React.useState(false);
  const [balance, setBalance] = React.useState<utils.BigNumber>(null);

  React.useEffect(() => {
    setAmount(getAuctionAmount());

    if (team !== undefined) {
      console.log('Auction', auction?.auction?.endTime.toString(), auction.hasStarted(), auction.hasEnded())
      setAuctionRunning(auction.hasStarted() && !auction.hasEnded());
    }
  }, [team]);

  React.useEffect(() => {
    web3.library.getBalance(web3.account)
      .then(setBalance);
  }, [web3.account]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const handlePlaceBid = async () => {
    try {
      if (!isValid(false)) {
        return;
      }
      setLoading(true);
      await auction.placeBid(position, utils.parseEther(amount));

      setTimeout(onClose, 500);
    } catch(e) {
      // TODO set error state
      console.log("Error placing bid", e)
    } finally {
      setLoading(false);
    }
  };

  const isValid = (allowZero?: boolean) => {
    try {
      const bn = utils.parseEther(amount);
      if (allowZero) {
        return true;
      }
      return !bn.isZero();
    } catch (e) {
      console.log('Invalid bid', amount, e);
      return false;
    }
  };

  const renderContent = () => {
    return (
      <>
        {balance && (
          <DialogContentText>
            {`Your balance ${formatEtherRounded(balance)}ETH`}
          </DialogContentText>
        )}
        <form onSubmit={handlePlaceBid}>
          <TextField
            label="Amount (ETH)"
            value={amount}
            onChange={handleAmountChange}
            margin="normal"
            type="tel" // Hides the up/down arrows
            error={!isValid(true)}
            variant='outlined'
            autoFocus={true}
          />
        </form>
      </>
    );
  };

  const connectAccount = () => {
    connector.activateMetamask();
  }

  const positionText = position &&` at ${moveToString(position.x, position.y)}`

  const title = auctionRunning
    ? `Place bid for ${Team[team]?.toUpperCase() || ''} team${positionText}`
    : `Waiting for other team to make a move`;

  return (
    <Dialog
      title={title}
      onClose={onClose}
      open={team !== undefined}
      loading={loading}
      disabled={!isValid()}
      onSubmit={auctionRunning && handlePlaceBid}
      submitTitle="PLACE BID!"
      renderContent={auctionRunning && renderContent}
    />
  );
};

export default PlaceBid;
