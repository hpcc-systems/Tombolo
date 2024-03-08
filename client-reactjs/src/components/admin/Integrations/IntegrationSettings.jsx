// Package imports
import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Local imports
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

  // The integration name from url be present in the integrations list in redux store
  const valid = integrations.some((i) => i.name === integrationName && i.application_id === applicationId);

  // If the integration name is not valid, show the IntegrationNotFound component
  if (!valid) {
    return <IntegrationNotFound />;
  } else {
    // Try importing the integration component with the name - integrationName
    // If error occurs, show the IntegrationNotFound component
    try {
      // pass relation id as props
      const relation_id = integrations.find(
        (i) => i.name === integrationName && i.application_id === applicationId
      ).integration_to_app_mapping_id;

      const IntegrationComponent = require(`./${integrationName}`).default;

      return <IntegrationComponent integration_to_app_mapping_id={relation_id} />;
    } catch (error) {
      return <IntegrationNotFound />;
    }
  }
}

export default IntegrationSettings;
