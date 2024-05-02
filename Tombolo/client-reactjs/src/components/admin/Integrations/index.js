// Package imports
import React, { useState, useEffect } from 'react';
const { message } = require('antd');

//Local Imports
import IntegrationsTable from './IntegrationsTable.jsx';
import BreadCrumbs from '../../common/BreadCrumbs.js';
import { getAllIntegrations } from './integration-utils.js';

function Integrations() {
  //Local States
  const [allIntegrations, setAllIntegrations] = useState([]);

  // Get all Integrations
  useEffect(() => {
    (async () => {
      try {
        const integrations = await getAllIntegrations();
        setAllIntegrations(integrations);
      } catch (error) {
        message.error('Failed to get integrations', error);
      }
    })();
  }, []);

  return (
    <>
      <BreadCrumbs />
      <IntegrationsTable allIntegrations={allIntegrations} setAllIntegrations={setAllIntegrations} />
    </>
  );
}

export default Integrations;
