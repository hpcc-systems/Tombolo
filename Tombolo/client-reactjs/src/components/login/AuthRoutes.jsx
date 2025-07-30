import React from 'react';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';
const Login = React.lazy(() => import('./login.jsx'));
const Register = React.lazy(() => import('./register.jsx'));
const ResetPassword = React.lazy(() => import('./ResetPasswordWithToken.jsx'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword.jsx'));
const resetTempPassword = React.lazy(() => import('./ResetTempPassword.jsx'));

const AuthRoutes = () => {
  //if traditional login isn't enabled, redirect user to login page
  const authMethods = import.meta.env.VITE_AUTH_METHODS;
  let traditionalEnabled = false;

  if (authMethods) {
    traditionalEnabled = authMethods.split(',').includes('traditional');
  }

  const content = () => {
    //if traditional isn't enabled, we only need login component, so redirect all routes to login
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
        {/* reset password with self requested token */}
        <Route path="/reset-password/:resetToken" component={ResetPassword} />
        <Route path="/forgot-password" component={ForgotPassword} />
        {/* reset password with temp password from owner/admin registration */}
        <Route path="/reset-temporary-password/:resetToken" component={resetTempPassword} />
        {/* redirect all other routes hit to login */}
        <Route path="*" component={Login} />
      </Switch>
    );
  };

  return <BasicLayout content={content()} width={'40rem'} />;
};

export default AuthRoutes;
