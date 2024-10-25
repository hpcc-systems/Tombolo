import React from 'react';
import BasicLayout from '../common/BasicLayout';
import { Route, Switch } from 'react-router-dom';
const Login = React.lazy(() => import('./login.js'));
const Register = React.lazy(() => import('./register.js'));
const ResetPassword = React.lazy(() => import('./ResetPassword.js'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword.js'));
const resetTempPassword = React.lazy(() => import('./ResetTempPw'));

const AuthRoutes = () => {
  return (
    <BasicLayout
      content={
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/reset-password/:resetToken" component={ResetPassword} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-temporary-password/:resetToken" component={resetTempPassword} />
          {/* redirect all other routes hit to login */}
          <Route path="*" component={Login} />
        </Switch>
      }
    />
  );
};

export default AuthRoutes;
