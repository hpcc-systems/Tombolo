import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Empty, Select } from 'antd';

import addQueriesToUrl from '../../../../common/AddQueryToUrl.js';
import { authHeader, handleError } from '../../../../common/AuthHeader.js';
import MeterGauge from './MeterGauge.jsx';
const { Option } = Select;

function CurrentClusterUsageCharts({ selectedCluster, setSelectedCluster }) {
  const [currentUsage, setCurrentUsage] = useState([]);
  const clusters = useSelector((state) => state.applicationReducer.clusters);

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

  //When cluster is changed from the drop down
  const handleClusterChange = (value) => {
    addQueriesToUrl({ queryName: 'clusterId', queryValue: value });
    setSelectedCluster(value);
  };

  return (
    <div
      style={{
        border: '1px solid lightGray',
        marginTop: '10px',
        textAlign: 'center',
        paddingBottom: '15px',
        minHeight: '82vh',
      }}>
      <div style={{ padding: '10px', fontSize: '20px', fontWeight: '500' }}>Current Storage Usage</div>
      <Select style={{ minWidth: '100px' }} onChange={handleClusterChange} value={selectedCluster}>
        {clusters.map((cluster) => {
          return (
            <Option key={cluster.id} label={cluster.name} value={cluster.id} sele>
              {' '}
              {cluster.name}{' '}
            </Option>
          );
        })}
      </Select>
      <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
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
