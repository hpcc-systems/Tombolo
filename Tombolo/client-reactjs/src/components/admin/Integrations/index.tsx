import React, { useState, useEffect } from 'react';
import { handleError } from '../../common/handleResponse';

import IntegrationsTable from './IntegrationsTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import integrationsService from '@/services/integrations.service';

const Integrations: React.FC = () => {
  const [allIntegrations, setAllIntegrations] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const integrations = await integrationsService.getAll();
        setAllIntegrations(integrations);
      } catch (_error) {
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
};

export default Integrations;
