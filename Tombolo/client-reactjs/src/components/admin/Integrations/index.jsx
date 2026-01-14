// Package imports
import React, { useState, useEffect } from 'react';
import { handleError } from '../../common/handleResponse';

//Local Imports
import IntegrationsTable from './IntegrationsTable.jsx';
import BreadCrumbs from '../../common/BreadCrumbs.jsx';
import integrationsService from '@/services/integrations.service';

function Integrations() {
  //Local States
  const [allIntegrations, setAllIntegrations] = useState([]);

  // Get all Integrations
  useEffect(() => {
    (async () => {
      try {
        const integrations = await integrationsService.getAll();
        setAllIntegrations(integrations);
      } catch (error) {
        handleError('Failed to get integrations');
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
