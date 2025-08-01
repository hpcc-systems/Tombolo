import React, { useEffect, useState } from 'react';
import LinePlot from './LinePlot';
import { Empty, Popover } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import _ from 'lodash';

import styles from '../clusterUsage.module.css';

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
    <div className={styles.storageUsageHistoryCharts__main}>
      <div className={styles.storageUsageHistoryCharts__chartContainer}>
        {groupedClusterUsageHistory.length > 0 ? (
          groupedClusterUsageHistory.map((clusterHistory, index) => {
            return (
              <div className={styles.storageUsageHistoryCharts__chartAndName} key={index}>
                <div className={styles.storageUsageHistoryCharts__box}>
                  <LinePlot clusterUsageHistory={clusterHistory.data} />
                </div>
                <div className={styles.storageUsageHistoryCharts__engineName}>
                  <span style={{ width: '250px', overflow: 'hidden' }}>
                    <div className={styles.storageUsageHistoryCharts__engineName_scroll}>
                      {clusterHistory.engines[0].length < 40
                        ? clusterHistory.engines[0]
                        : clusterHistory.engines[0].slice(0, 22) +
                          ' ... ' +
                          clusterHistory.engines[0].slice(
                            clusterHistory.engines[0].length - 3,
                            clusterHistory.engines[0].length
                          )}
                    </div>
                  </span>
                  <span className={styles.storageUsageHistoryCharts__engineName__additionalText}>
                    <Popover
                      content={clusterHistory.engines.map((item, index) => (
                        <div key={index}>{index === 0 ? null : _.capitalize(item)}</div>
                      ))}>
                      {clusterHistory.engines.length > 1 ? (
                        <span> &nbsp; {`[ +${clusterHistory.engines.length - 1} more ]`}</span>
                      ) : null}
                    </Popover>
                  </span>
                  <ExpandOutlined
                    onClick={() => handleViewMoreClicked(clusterHistory.data)}
                    className={styles.storageUsageHistoryCharts__viewMore}
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
