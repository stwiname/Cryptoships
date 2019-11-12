import Typography from '@material-ui/core/Typography';
import * as React from 'react';

type Props = {};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  public static state: Readonly<State> = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.log('componetDidCatch', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <Typography>Error happened</Typography>;
    }

    return this.props.children;
  }
}
