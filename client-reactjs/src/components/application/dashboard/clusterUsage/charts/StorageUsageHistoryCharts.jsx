import React, { useEffect, useState } from 'react';
import LinePlot from './LinePlot';
import { Empty } from 'antd';

function StorageUsageHistoryCharts({ clusterUsageHistory }) {
  const [engines, setEngines] = useState([]);

  useEffect(() => {
    if (clusterUsageHistory) {
      setEngines(Object.keys(clusterUsageHistory));
    }
  }, [clusterUsageHistory]);

  return (
    <div style={{ border: '1px solid lightgray', textAlign: 'center', marginTop: '20px' }}>
      <div style={{ padding: '10px', fontSize: '20px', fontWeight: '500' }}>Storage Usage History</div>
      <div
        style={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap', maxWidth: '100%', overflow: 'auto' }}>
        {engines.length > 1 ? (
          engines.map((engine) => {
            return (
              <div key={engine} style={{ margin: '15px', padding: '10px', flex: '1' }}>
                <LinePlot clusterUsageHistory={clusterUsageHistory[engine]} />
                <div style={{ marginTop: '15px', fontSize: '15px', fontWeight: '700', color: 'gray' }}>{engine}</div>
              </div>
            );
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
}

export default StorageUsageHistoryCharts;
