import React from 'react';
import { Switch, Route } from 'react-router-dom';
import NoAccess from './noAccess';

const NoAccessRoutes = () => {
  return (
    <Switch>
      <Route path="*" component={NoAccess} />
    </Switch>
  );
};

export default NoAccessRoutes;
