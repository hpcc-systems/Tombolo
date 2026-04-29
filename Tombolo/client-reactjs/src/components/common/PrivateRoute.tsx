import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser } from './userStorage';

type PrivateRouteProps = {
  children?: React.ReactElement;
};

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();

  if (getUser()) {
    return children ?? <Outlet />;
  }

  const intendedUrl = `${location.pathname}${location.search || ''}${location.hash || ''}`;
  localStorage.setItem('intendedUrl', intendedUrl);

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
