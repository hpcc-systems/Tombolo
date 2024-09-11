import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Empty, Select } from 'antd';

import { addQueriesToUrl } from '../../../../common/AddQueryToUrl.js';
import { authHeader, handleError } from '../../../../common/AuthHeader.js';
import MeterGauge from './MeterGauge.jsx';
import '../index.css';
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
      if (!response.ok) {
        handleError(response);
        return;
      }
      const data = await response.json();

      const groupedUsage = [];
      const groupedData = {};

      data.forEach((d) => {
        const key = d.maxUsage + 'x' + d.meanUsage;
        if (groupedData[key]) {
          const newEngineList = [...groupedData[key].engines, d.name];
          groupedData[key] = { ...groupedData[key], engines: newEngineList };
        } else {
          groupedData[key] = { data: { maxUsage: d.maxUsage, meanUsage: d.meanUsage }, engines: [d.name] };
        }
      });

      if (Object.keys(groupedData).length > 0) {
        for (const key in groupedData) {
          groupedUsage.push({ data: groupedData[key].data, engines: groupedData[key].engines });
        }
      }

      setCurrentUsage(groupedUsage);
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
    <div className="currentClusterUsageCharts_container">
      <div>
        {clusters ? (
          <Select
            onChange={handleClusterChange}
            value={selectedCluster}
            className="currentClusterUsageCharts_clusterSelector">
            {clusters.map((cluster) => {
              return (
                <Option key={cluster.id} label={cluster.name} value={cluster.id}>
                  {cluster.name}
                </Option>
              );
            })}
          </Select>
        ) : null}
      </div>
      <div className="currentClusterUsageCharts_main">
        {/* <div className="currentClusterUsageCharts_title">Current Storage Usage</div> */}

        {currentUsage.length < 1 ? (
          <div className="currentClusterUsageCharts_empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div
            className={
              currentUsage.length < 5
                ? 'currentClusterUsageCharts_meterGauges_5orLess'
                : 'currentClusterUsageCharts_meterGauges_5orMore'
            }>
            {currentUsage.map((current) => {
              return (
                <div className="currentClusterUsageCharts_meterGaugeBox" key={current.engines[0]}>
                  <MeterGauge data={{ ...current.data, name: current.engines[0], engines: current.engines }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrentClusterUsageCharts;
