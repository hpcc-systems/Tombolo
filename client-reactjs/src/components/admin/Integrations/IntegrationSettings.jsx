/* eslint-disable unused-imports/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import IntegrationNotFound from './IntegrationNotFound';

function IntegrationSettings() {
  const {
    applicationReducer: { integrations },
  } = useSelector((state) => state);

  const integrationNames = integrations.filter((i) => i.active).map((i) => i.name.toLowerCase());

  let { integrationName } = useParams();
  integrationName = integrationName.toLowerCase();

  // Local States
  const [IntegrationComponent, setIntegrationComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModule = async () => {
      if (integrationNames.includes(integrationName)) {
        try {
          const module = await import(`./${integrationName}`);
          setIntegrationComponent(() => module.default);
        } catch (err) {
          console.error(`Failed to load module: ${err}`);
          setError(err);
        }
      } else {
        setError(new Error('Integration not found'));
      }
    };

    loadModule();
  }, [integrations]);

  if (error) {
    return <IntegrationNotFound />;
  }

  if (!IntegrationComponent) {
    return <IntegrationNotFound />;
  }

  return <IntegrationComponent integrationName={integrationName} />;
}

export default IntegrationSettings;
