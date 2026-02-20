import React, { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import IntegrationNotFound from './IntegrationNotFound';

const IntegrationSettings: React.FC = () => {
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const { integrationName } = useParams<{ integrationName?: string }>();

  const valid = !!(
    integrationName && integrations.some((i: any) => i.name === integrationName && i.application_id === applicationId)
  );

  if (!valid) return <IntegrationNotFound />;

  const relation = integrations.find((i: any) => i.name === integrationName && i.application_id === applicationId);
  const relation_id = relation?.integration_to_app_mapping_id;

  const IntegrationComponent = lazy(() =>
    import(`./${integrationName!.toLowerCase()}/index`).catch(error => {
      console.error('Failed to load component for %s:', integrationName, error);
      return { default: IntegrationNotFound } as any;
    })
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationComponent integration_to_app_mapping_id={relation_id} />
    </Suspense>
  );
};

export default IntegrationSettings;
