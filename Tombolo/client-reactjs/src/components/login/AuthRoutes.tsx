import React from 'react';
import { Route, Switch } from 'react-router-dom';

import BasicLayout from '../common/BasicLayout';

const Login = React.lazy(() => import('./login'));
const Register = React.lazy(() => import('./register'));
const ResetPassword = React.lazy(() => import('./ResetPasswordWithToken'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const resetTempPassword = React.lazy(() => import('./ResetTempPassword'));

const AuthRoutes: React.FC = () => {
  const authMethods = import.meta.env.VITE_AUTH_METHODS as any;
  let traditionalEnabled = false;

  if (authMethods) {
    traditionalEnabled = authMethods.split(',').includes('traditional');
  }

  const content = () => {
    if (!traditionalEnabled) {
      return (
        <Switch>
          <Route path="*" component={Login} />
        </Switch>
      );
    }

    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/reset-password/:resetToken" component={ResetPassword} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-temporary-password/:resetToken" component={resetTempPassword} />
        <Route path="*" component={Login} />
      </Switch>
    );
  };

  return <BasicLayout content={content()} width={'40rem'} />;
};

export default AuthRoutes;
