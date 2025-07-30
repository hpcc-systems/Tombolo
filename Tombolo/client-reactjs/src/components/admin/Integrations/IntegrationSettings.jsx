import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import IntegrationNotFound from './IntegrationNotFound';

function IntegrationSettings() {
  // Redux
  const {
    applicationReducer: {
      integrations,
      application: { applicationId },
    },
  } = useSelector((state) => state);

  // Integration name from URL
  let { integrationName } = useParams();

  // Validate integration name
  const valid = integrations.some((i) => i.name === integrationName && i.application_id === applicationId);

  // If the integration name is not valid, show IntegrationNotFound
  if (!valid) {
    return <IntegrationNotFound />;
  }

  // Find relation_id
  const relation_id = integrations.find(
    (i) => i.name === integrationName && i.application_id === applicationId
  ).integration_to_app_mapping_id;

  // Dynamically import the integration component
  const IntegrationComponent = lazy(() =>
    import(`./${integrationName.toLowerCase()}.jsx`).catch((error) => {
      console.error("Failed to load component for %s:", integrationName, error);
      return { default: IntegrationNotFound };
    })
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationComponent integration_to_app_mapping_id={relation_id} />
    </Suspense>
  );
}

export default IntegrationSettings;
