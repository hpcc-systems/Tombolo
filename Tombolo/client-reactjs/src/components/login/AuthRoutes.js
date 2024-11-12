import React from 'react';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';
const Login = React.lazy(() => import('./login.js'));
const Register = React.lazy(() => import('./register.js'));
const ResetPassword = React.lazy(() => import('./ResetPassword.js'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword.js'));
const resetTempPassword = React.lazy(() => import('./ResetTempPw'));

const AuthRoutes = () => {
  //if traditional login isn't enabled, redirect user to login page
  const authMethods = process.env.REACT_APP_AUTH_METHODS;
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
        <Route path="/reset-password/:resetToken" component={ResetPassword} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-temporary-password" component={resetTempPassword} />
        {/* redirect all other routes hit to login */}
        <Route path="*" component={Login} />
      </Switch>
    );
  };

  return <BasicLayout content={content()} />;
};

export default AuthRoutes;
