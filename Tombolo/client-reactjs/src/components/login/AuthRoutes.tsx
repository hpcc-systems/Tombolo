import React from 'react';
import { Route, Routes } from 'react-router-dom';

import BasicLayout from '../common/BasicLayout';

const Login = React.lazy(() => import('./login'));
const Register = React.lazy(() => import('./register'));
const ResetPassword = React.lazy(() => import('./ResetPasswordWithToken'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const ResetTempPassword = React.lazy(() => import('./ResetTempPassword'));

const AuthRoutes: React.FC = () => {
  const authMethods = import.meta.env.VITE_AUTH_METHODS as any;
  let traditionalEnabled = false;

  if (authMethods) {
    traditionalEnabled = authMethods.split(',').includes('traditional');
  }

  const content = () => {
    if (!traditionalEnabled) {
      return (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      );
    }

    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-temporary-password/:resetToken" element={<ResetTempPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  };

  return <BasicLayout content={content()} width={'40rem'} />;
};

export default AuthRoutes;
