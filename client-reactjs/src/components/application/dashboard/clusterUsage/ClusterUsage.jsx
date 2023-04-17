import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Resizable } from 're-resizable';
import { useSelector } from 'react-redux';
import { Tabs } from 'antd';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import StorageUsageHistoryCharts from './charts/StorageUsageHistoryCharts.jsx';
import Filters from './charts/Filters.jsx';
import CurrentClusterUsageCharts from './charts/CurrentClusterUsageCharts.jsx';
import ExportMenu from '../ExportMenu/ExportMenu.jsx';

function ClusterUsage() {
  const [clusterUsageHistory, setClusterUsageHistory] = useState({});
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusterOptions, setClusterOptions] = useState([]);
  const [historyDateRange, setHistoryDateRange] = useState([moment().subtract(30, 'days'), moment()]);

  const clusters = useSelector((state) => state.applicationReducer.clusters);

  // Sets default cluster and cluster options when clusters from redux store are loaded
  useEffect(() => {
    if (clusters) {
      const options = clusters.map((cluster) => ({
        label: cluster.name,
        value: cluster.id,
      }));
      setClusterOptions(options);
      setSelectedCluster(options[0]?.value); // Selects the first cluster in array by default
    }
  }, []);

  // When the component loads || cluster selection changes || date range changes
  useEffect(() => {
    if (selectedCluster && historyDateRange) getClusterUsageHistory(selectedCluster, historyDateRange);
  }, [selectedCluster, historyDateRange]);

  //Get current usage func
  const getClusterUsageHistory = async (clusterId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      //Query data
      const queryData = JSON.stringify({ clusterId, historyDateRange });

      const response = await fetch(`/api/cluster/clusterStorageHistory/${queryData}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setClusterUsageHistory(data);
    } catch (err) {
      setClusterUsageHistory([]);
      handleError(err);
    }
  };

  return (
    <Tabs tabBarExtraContent={<ExportMenu />}>
      <Tabs.TabPane tab={clusterOptions.filter((cluster) => cluster.value == selectedCluster)[0]?.label}>
        <Filters
          setSelectedCluster={setSelectedCluster}
          selectedCluster={selectedCluster}
          clusterOptions={clusterOptions}
          setHistoryDateRange={setHistoryDateRange}
        />
        <Resizable>
          <StorageUsageHistoryCharts clusterUsageHistory={clusterUsageHistory} selectedCluster={selectedCluster} />
        </Resizable>
        <Resizable>
          <CurrentClusterUsageCharts selectedCluster={selectedCluster} />
        </Resizable>
      </Tabs.TabPane>
    </Tabs>
  );
}

export default ClusterUsage;

//TODO
// Loading indicators on charts
// Add Expandable
// Make charts responsive. Line graph and graph in notification are not responsive
// Moved dashboards related css to separate file

// TODO - Monitorings status and monitoring type must from the below set
// STATUS -> notified , triage, inProgress, completed
// MONITORING TYPE -> 'jobMonitoring', 'file','cluster','superFile' }
//  Make sure all the columns in notification tables are populated
//  Check backend validation
//  Add filters to notification table
