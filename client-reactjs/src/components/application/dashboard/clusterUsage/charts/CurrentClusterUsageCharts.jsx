import React, { useEffect, useState } from 'react';
import { Empty } from 'antd';

import { authHeader, handleError } from '../../../../common/AuthHeader.js';
import MeterGauge from './MeterGauge.jsx';

function CurrentClusterUsageCharts({ selectedCluster }) {
  const [currentUsage, setCurrentUsage] = useState([]);

  useEffect(() => {
    if (selectedCluster) {
      getCurrentClusterUsage(selectedCluster);
    }
  }, [selectedCluster]);

  //Get current usage func
  const getCurrentClusterUsage = async (clusterId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/cluster/currentClusterUsage/${clusterId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setCurrentUsage(data);
    } catch (err) {
      setCurrentUsage([]);
      handleError(err);
    }
  };

  return (
    <div style={{ border: '1px solid lightGray', marginTop: '10px', textAlign: 'center', paddingBottom: '15px' }}>
      <div style={{ padding: '10px', fontSize: '20px', fontWeight: '500' }}>Current Storage Usage</div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {currentUsage.length < 1 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          currentUsage.map((current) => {
            return <MeterGauge key={current.name} data={current} />;
          })
        )}
      </div>
    </div>
  );
}

export default CurrentClusterUsageCharts;
