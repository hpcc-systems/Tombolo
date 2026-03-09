import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { getUser } from './userStorage';

export const PrivateRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        if (getUser()) {
          return <Component {...props} {...rest} />;
        } else {
          // Store the intended URL in localStorage for reliable access after login
          const intendedUrl = `${props.location.pathname}${props.location.search || ''}${props.location.hash || ''}`;
          localStorage.setItem('intendedUrl', intendedUrl);

          return <Redirect to={{ pathname: '/login', state: { from: props.location } }} />;
        }
      }}
    />
  );
};
