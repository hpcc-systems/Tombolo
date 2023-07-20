import React, { useEffect, useState } from 'react';
import LinePlot from './LinePlot';
import { Empty, Popover } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import _ from 'lodash';

import '../index.css';

function StorageUsageHistoryCharts({ clusterUsageHistory, setViewExpandedGraph, setExpandedGraphData }) {
  const [groupedClusterUsageHistory, setGroupedClusterUsageHistory] = useState([]);

  useEffect(() => {
    if (clusterUsageHistory) {
      const groupedHistory = [];
      const groupedData = {};

      for (const engine in clusterUsageHistory) {
        const data = clusterUsageHistory[engine];
        const key = JSON.stringify(data);

        if (Object.prototype.hasOwnProperty.call(groupedData, key)) {
          groupedData[key].engines.push(engine);
        } else {
          groupedData[key] = { engines: [engine], data };
        }
      }

      for (const key in groupedData) {
        groupedHistory.push(groupedData[key]);
      }
      setGroupedClusterUsageHistory(groupedHistory);
    }
  }, [clusterUsageHistory]);

  // When expand icon is clicked
  const handleViewMoreClicked = (data) => {
    setViewExpandedGraph(true);
    setExpandedGraphData(data);
  };

  return (
    <div className="storageUsageHistoryCharts__main">
      <div className="storageUsageHistoryCharts__heading">Storage Usage History</div>
      <div className="storageUsageHistoryCharts__chartContainer">
        {groupedClusterUsageHistory.length > 0 ? (
          groupedClusterUsageHistory.map((clusterHistory, index) => {
            return (
              <div className="storageUsageHistoryCharts__chartAndName" key={index}>
                <div className="storageUsageHistoryCharts__box">
                  <LinePlot clusterUsageHistory={clusterHistory.data} />
                </div>
                <div className="storageUsageHistoryCharts__engineName">
                  <span>{_.capitalize(clusterHistory.engines[0])}</span>
                  <span className="storageUsageHistoryCharts__engineName__additionalText">
                    <Popover
                      content={clusterHistory.engines.map((item, index) => (
                        <div key={index}>{index === 0 ? null : _.capitalize(item)}</div>
                      ))}>
                      {clusterHistory.engines.length > 1 ? (
                        <span> &nbsp; {`[ + ${clusterHistory.engines.length - 1} more ]`}</span>
                      ) : null}
                    </Popover>
                  </span>
                  <ExpandOutlined
                    onClick={() => handleViewMoreClicked(clusterHistory.data)}
                    className="storageUsageHistoryCharts__viewMore"
                  />
                </div>
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
