import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { getUser } from './userStorage';

type PrivateRouteProps = {
  component: React.ComponentType<any>;
  [key: string]: any;
};

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props => {
        if (getUser()) {
          return <Component {...props} {...rest} />;
        } else {
          const intendedUrl = `${props.location.pathname}${props.location.search || ''}${props.location.hash || ''}`;
          localStorage.setItem('intendedUrl', intendedUrl);

          return <Redirect to={{ pathname: '/login', state: { from: props.location } }} />;
        }
      }}
    />
  );
};

export default PrivateRoute;
