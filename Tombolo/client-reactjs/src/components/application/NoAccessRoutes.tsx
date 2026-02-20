import React from 'react';
import { Route, Switch } from 'react-router-dom';
import NoAccess from './noAccess';

const NoAccessRoutes: React.FC<any> = () => (
  <Switch>
    <Route path="/no-access" component={NoAccess} />
  </Switch>
);

export default NoAccessRoutes;
