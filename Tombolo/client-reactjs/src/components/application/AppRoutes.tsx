import React, { Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';

const Home = React.lazy(() => import('./home'));
const OrbitProfileMonitoring = React.lazy(() => import('./orbitProfileMonitoring'));
const OrbitMonitoring = React.lazy(() => import('./orbitMonitoring/OrbitMonitoring'));

function AppRoutes(props: any) {
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/orbitProfileMonitoring" component={OrbitProfileMonitoring} />
        <Route path="/orbitMonitoring" component={OrbitMonitoring} />
      </Switch>
    </Suspense>
  );
}

export default AppRoutes;
