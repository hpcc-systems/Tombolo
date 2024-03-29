// Package Imports
import React from 'react';
import { Result, Button } from 'antd';
import { useHistory } from 'react-router-dom';

// Local Imports
import './integrations.css';

function IntegrationNotFound() {
  const history = useHistory();

  // Handle Go to Integration
  const handleGoToIntegration = () => {
    history.push('/admin/integrations');
  };

  return (
    <div className="integrationSettings__unavailable">
      <Result
        status="500"
        title="Oops !!"
        subTitle="Integration settings not available."
        extra={
          <Button type="primary" onClick={handleGoToIntegration}>
            Go to Integrations
          </Button>
        }
      />
    </div>
  );
}

export default IntegrationNotFound;
