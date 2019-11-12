import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { green } from '@material-ui/core/colors';
import MUIDialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';

export type Props = {
  open: boolean;
  title?: string;
  loading?: boolean;
  submitTitle?: string;
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
      color: green[500],
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -12,
      marginLeft: -12,
    },
  })
);

const Dialog: React.FunctionComponent<Props> = ({
  open,
  title,
  loading,
  submitTitle,
  renderContent,
  onSubmit,
  onClose,
}) => {
  const classes = useStyles({});

  return (
    <MUIDialog open={open} onClose={onClose}>
      {title && <DialogTitle>{title}</DialogTitle>}
      {renderContent && <DialogContent>{renderContent()}</DialogContent>}
      {onSubmit && (
        <DialogActions>
          <div className={classes.wrapper}>
            <Button
              variant="contained"
              color="primary"
              onClick={onSubmit}
              disabled={loading}
            >
              {submitTitle || 'Submit'}
            </Button>
            {loading && (
              <CircularProgress size={24} className={classes.buttonProgress} />
            )}
          </div>
        </DialogActions>
      )}
    </MUIDialog>
  );
};

export default Dialog;
