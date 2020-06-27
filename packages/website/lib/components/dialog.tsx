import CircularProgress from '@material-ui/core/CircularProgress';
import MUIDialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { DrawerProps} from '@material-ui/core/Drawer';
import { Drawer as MUIDrawer } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import * as React from 'react';
import ThreeDButton from './3dbutton';
import { isMobile } from 'react-device-detect';

export type Props = {
  open: boolean;
  title?: string;
  submitTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  renderContent?: () => React.ReactElement;
  onSubmit?: () => void;
  onClose: () => void;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    wrapper: {
      margin: theme.spacing(1),
      position: 'relative',
    },
    buttonProgress: {
      color: theme.palette.tertiary.main,
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -12,
      marginLeft: -12,
    },
  })
);

const Drawer: React.FC<DrawerProps> = props => {
  return <MUIDrawer
    anchor='bottom'
    {...props}
  />
}

const Dialog: React.FunctionComponent<Props> = ({
  open,
  title,
  loading,
  disabled,
  submitTitle,
  renderContent,
  onSubmit,
  onClose,
}) => {
  const classes = useStyles({});

  const Container = isMobile ? Drawer : MUIDialog;

  return (
    <Container
      open={open}
      onClose={onClose}
    >
      {title && <DialogTitle>{title}</DialogTitle>}
      {renderContent && <DialogContent>{renderContent()}</DialogContent>}
      {onSubmit && (
        <DialogActions>
          <div className={classes.wrapper}>
            <ThreeDButton
              onClick={onSubmit}
              disabled={disabled || loading}
            >
              {submitTitle || 'SUBMIT'}
            </ThreeDButton>
            {loading && (
              <CircularProgress size={24} className={classes.buttonProgress} />
            )}
          </div>
        </DialogActions>
      )}
    </Container>
  );
};

export default Dialog;
