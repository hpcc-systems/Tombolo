import React, { useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';

const HPCC_Tools: React.FC = () => {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/hpcc-tools-docs/available')
      .then(res => res.json())
      .then(data => setAvailable(data.available))
      .catch(() => setAvailable(false));
  }, []);

  if (available === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!available) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert
          type="warning"
          showIcon
          message="HPCC Tools Not Available"
          description="Tombolo hasn't downloaded the HPCC Tools documentation yet. The files are synced automatically — please check back shortly or contact your administrator."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <iframe
          src="/api/hpcc-tools-docs/"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="HPCC Tools Documentation"
        />
      </div>
    </div>
  );
};

export default HPCC_Tools;
