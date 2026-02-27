import React, { Component, ReactNode } from 'react';
import ErrorPage from './ErrorPage';

type Props = { children?: ReactNode };
type State = { hasError: boolean; message: string };

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || '' };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage message={this.state.message} />;
    }
    return this.props.children as ReactNode;
  }
}

export default ErrorBoundary;
