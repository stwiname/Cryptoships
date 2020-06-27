import * as React from 'react';
import { useWeb3React } from '@web3-react/core';
import Dialog from './dialog';
import { Connector } from '../containers';
import connectors from '../connectors';
import Button from '@material-ui/core/Button';
import { List, ListItem, Typography, CircularProgress, Link } from '@material-ui/core';
import { isBrowser, isMobile } from 'react-device-detect';
const MetaMask = require('../../dist/assets/metamask.svg');
const WalletConnect = require('../../dist/assets/walletconnect-logo.svg');
const Sylo = require('../../dist/assets/sylo.svg');

type Props = {
  open: boolean;
  onClose: () => void;
}

type OptionProps = { name: string, icon?: string, onClick: () => void};

const WalletOption: React.FC<OptionProps> = props => {
  return <Button
    onClick={props.onClick}
    endIcon={<img src={props.icon} style={{ height: '25px' }}/>}
    variant='outlined'
    color='primary'
    style={{ width: '100%'}}
  >
    {props.name}
  </Button>;
}

const WalletOptions: React.FC<{}> = props => {
  const connector = Connector.useContainer();
  const [activatingSingle, setActivatingSingle] = React.useState(false);

  const options: OptionProps[] = [];
  const injected = (window as any).ethereum;

  if (injected) {
    options.push({
      name: injected.isMetaMask
        ? 'MetaMask'
        : injected.isSylo
          ? 'Sylo'
          : 'Injected',
      icon: injected.isMetaMask
        ? MetaMask
        : injected.isSylo
          ? Sylo
          : undefined,
      onClick: connector.activateMetamask
    });
  }
  else {
    if (isMobile) {
      options.push({
        name: 'Install Sylo',
        icon: Sylo,
        onClick: () => window.open('https://sylo.io/wallet','_blank')
      });
    }
    else {
      options.push({
        name: 'Install MetaMask',
        icon: MetaMask,
        onClick: () => window.open('https://metamask.io','_blank')
      });
    }
  }

  if (isBrowser) {
    options.push({
      name: 'WalletConnect',
      icon: WalletConnect,
      onClick: connector.activateWalletConnect,
    });
  }

  // If theres only one option (injectect) we activate straight away
  React.useEffect(() => {
    if (isMobile && options.length === 1) {
      connector.activateMetamask();
      setActivatingSingle(true);
    }
  }, []);

  if (activatingSingle) {
    return <CircularProgress />
  }

  return <>
    <List>
      {options.map(option => <ListItem key={option.name}>
          <WalletOption {...option}/>
        </ListItem>
      )}
    </List>
    <Link
      href='https://ethereum.org/wallets/'
      target='_blank'
      color='secondary'
      underline='always'
      style={{}}
    >
      Learn about wallets
    </Link>
  </>;
}

const Account: React.FC<{}> = props => {
  const web3 = useWeb3React();

  const [accountName, setAccountName] = React.useState<string>('');

  React.useEffect(() => {
    if (!web3.account) {
      setAccountName('');
      return;
    }

    web3.library.lookupAddress(web3.account)
      .then((address: string) => {
        if (address) {
          setAccountName(address);
        }
      });
  }, [web3.account]);
  return <>
    <Typography variant='subtitle1' color='primary'>
      {accountName || web3.account}
    </Typography>
    {
      !!accountName &&
      accountName !== web3.account &&
      <Typography variant='subtitle1' color='secondary' noWrap={true}>
        {web3.account}
      </Typography>
    }
  </>;
}

const Wallet: React.FC<Props> = props => {
  const web3 = useWeb3React();
  const connector = Connector.useContainer();

  const renderContent = () => {
    if (web3.account) {
      return <Account/>;
    }

    return <WalletOptions/>;
  }

  return <Dialog
    title={web3.account ? 'Account' : 'Connect wallet'}
    open={props.open}
    onClose={props.onClose}
    renderContent={renderContent}
    onSubmit={web3.account && connector.deactivate}
    submitTitle='Disconnect'
  />;
}

export default Wallet;
