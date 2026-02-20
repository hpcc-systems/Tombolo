import React from 'react';
import { Result, Button } from 'antd';
import { useHistory } from 'react-router-dom';

import styles from './integrations.module.css';

const IntegrationNotFound: React.FC = () => {
  const history = useHistory();

  const handleGoToIntegration = () => {
    history.push('/admin/integrations');
  };

  return (
    <div className={styles.integrationSettings__unavailable}>
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
};

export default IntegrationNotFound;
