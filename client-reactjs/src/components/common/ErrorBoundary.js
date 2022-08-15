import React, { Component } from 'react';
import ErrorPage from './ErrorPage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error, info) {
    console.log('--Error Boundaries catch ----------------------------------------');
    console.dir({ error, info }, { depth: null });
    console.log('------------------------------------------');
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage message={this.state.message} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
