import * as React from 'react';
import { Admin as AdminContainer } from '../containers';
import { match } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { utils } from 'ethers';
import { bnToDate} from '../utils';
import Button from '@material-ui/core/Button';
import { useThemeStyles } from '../theme';

type Props = {
  match: match<{ address: string }>;
}

const Admin: React.FunctionComponent<Props> = props => {
  const themeClasses = useThemeStyles({});

  const admin = AdminContainer.useContainer();

  const withdrawDate = bnToDate(admin.withdrawDeadline);

  return <Box
      alignItems='center'
      display='flex'
      flexDirection='column'
      height='100%'
    >

    <Typography variant='h3' className={themeClasses.comingSoon}>
      Admin
    </Typography>

    <Typography>
      {`Is Admin: ${admin.isAdmin}`}
    </Typography>

    <Typography>
      {`Contract balance ${utils.formatEther(admin.balance ?? new utils.BigNumber(0))}ETH`}
    </Typography>

    <Typography>
      {`Withdraw deadline ${withdrawDate}`}
    </Typography>

    <Button
      variant="contained"
      onClick={admin.claim}
      disabled={admin.isAdmin && withdrawDate && new Date().getTime() < withdrawDate.getTime()}
    >
      Claim!
    </Button>
  </Box>;
}

const Container: React.FunctionComponent<Props> = props => {
  return (
    <AdminContainer.Provider initialState={props.match.params.address}>
      <Admin {...props} />
    </AdminContainer.Provider>
  );
}

export default Container;
