import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NoAccess from './noAccess';

const NoAccessRoutes: React.FC<any> = () => (
  <Routes>
    <Route path="/no-access" element={<NoAccess />} />
    <Route path="*" element={<NoAccess />} />
  </Routes>
);

export default NoAccessRoutes;
