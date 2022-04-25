import { useIsAuthenticated } from '@azure/msal-react';
import React from 'react';
import { Route, Redirect } from 'react-router-dom';

export const PrivateRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Route
      {...rest}
      render={(props) =>
        localStorage.getItem('user') || isAuthenticated ? (
          <Component {...props} {...rest} />
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      }
    />
  );
};
