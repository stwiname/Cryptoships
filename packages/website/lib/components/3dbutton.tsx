import * as React from 'react';
import ButtonBase, { ButtonBaseProps, ButtonBaseTypeMap} from '@material-ui/core/ButtonBase';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography, { TypographyProps } from '@material-ui/core/Typography';
import { useThemeStyles } from '../theme';
import clsx from 'clsx';

type Props<T extends React.ReactElement<any>> = {
  className?: string;
  component?: T;
}
& ButtonBaseProps<ButtonBaseTypeMap['defaultComponent'], T['props']>
& Pick<TypographyProps, 'variant'>;

function ThreeDButton<T extends React.ReactElement<any>>(props: Props<T>) {

  const themeClasses = useThemeStyles({});

  return <ButtonBase
    {...props}
  >
    <Typography
      className={clsx(themeClasses.play, props.className)}
      variant={props.variant ?? 'h5'}
      style={{ whiteSpace: 'nowrap' }}
      color={props.color}
    >
      {props.children}
    </Typography>
  </ButtonBase>;
}

export default ThreeDButton;
