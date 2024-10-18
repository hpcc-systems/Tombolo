import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { Tabs } from 'antd';
import GraphExpanded from './charts/GraphExpanded.jsx';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import StorageUsageHistoryCharts from './charts/StorageUsageHistoryCharts.jsx';
import Filters from './charts/Filters.jsx';
import CurrentClusterUsageCharts from './charts/CurrentClusterUsageCharts.jsx';
import ExportMenu from '../ExportMenu/ExportMenu.jsx';
import { getQueryParamsFromUrl, addQueriesToUrl } from '../../../common/AddQueryToUrl.js';

function ClusterUsage() {
  const [clusterUsageHistory, setClusterUsageHistory] = useState({});
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [historyDateRange, setHistoryDateRange] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [viewExpandedGraph, setViewExpandedGraph] = useState(false);
  const [expandedGraphData, setExpandedGraphData] = useState([]);
  const [clusterOptions, setClusterOptions] = useState([]);
  const clusters = useSelector((state) => state.applicationReducer.clusters);

  // Sets default cluster and cluster options when clusters from redux store are loaded
  useEffect(() => {
    const urlQueries = getQueryParamsFromUrl();

    // If cluster id in url
    if (urlQueries.clusterId) {
      setSelectedCluster(urlQueries.clusterId);
    }

    // If no clusterId in url
    if (clusters?.length && !urlQueries.clusterId) {
      setSelectedCluster(clusters[0].id);
      addQueriesToUrl({ queryName: 'clusterId', queryValue: clusters[0].id });
    }

    // If url has active tab, use that as active tab, else set "1" as active tab
    if (urlQueries.activeTab) {
      setActiveTab(urlQueries.activeTab);
    } else {
      setActiveTab('1');
      addQueriesToUrl({ queryName: 'activeTab', queryValue: '1' });
    }

    // If date range in URL
    if (urlQueries.historyDateRange) {
      const { historyDateRange } = urlQueries;
      const range = historyDateRange.split(',');
      const startDate = range[0];
      const endDate = range[1];
      setHistoryDateRange([dayjs(new Date(startDate)), dayjs(new Date(endDate))]);
    } else {
      setHistoryDateRange([dayjs().subtract(30, 'days'), dayjs()]);
    }
  }, []);

  useEffect(() => {
    if (clusters) {
      //Options to display in drop down
      const options = clusters.map((cluster) => ({
        label: cluster.name,
        value: cluster.id,
      }));
      setClusterOptions(options);
    }
  }, [clusters]);

  //Handle tab switching - TODO pass this as props
  const handleTabSwitching = (tab) => {
    addQueriesToUrl({ queryName: 'activeTab', queryValue: tab });
    setActiveTab(tab);
  };

  // When the component loads || cluster selection changes || date range changes
  useEffect(() => {
    if (selectedCluster && historyDateRange) getClusterUsageHistory(selectedCluster, historyDateRange);
  }, [selectedCluster, historyDateRange]);

  //Get  usage history  func
  const getClusterUsageHistory = async (clusterId) => {
    try {
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };

      //Query data
      const queryData = JSON.stringify({ clusterId, historyDateRange });

      const response = await fetch(`/api/cluster/clusterStorageHistory/${queryData}`, payload);
      if (!response.ok) {
        handleError(response);
        return;
      }
      const data = await response.json();
      setClusterUsageHistory(data);
    } catch (err) {
      setClusterUsageHistory([]);
      handleError(err);
    }
  };

  return (
    <Tabs
      tabBarExtraContent={<ExportMenu selectedCluster={selectedCluster} />}
      activeKey={activeTab}
      type="card"
      onChange={handleTabSwitching}>
      <Tabs.TabPane tab="Usage history" key="1">
        <Filters
          setSelectedCluster={setSelectedCluster}
          selectedCluster={selectedCluster}
          setHistoryDateRange={setHistoryDateRange}
          historyDateRange={historyDateRange}
          clusterOptions={clusterOptions}
        />
        <StorageUsageHistoryCharts
          clusterUsageHistory={clusterUsageHistory}
          setViewExpandedGraph={setViewExpandedGraph}
          setExpandedGraphData={setExpandedGraphData}
        />
        {viewExpandedGraph ? (
          <GraphExpanded
            setViewExpandedGraph={setViewExpandedGraph}
            clusterUsageHistory={expandedGraphData}
            selectedCluster={selectedCluster}
          />
        ) : null}
      </Tabs.TabPane>
      <Tabs.TabPane tab="Current usage" key="2">
        <CurrentClusterUsageCharts
          setActiveTab={setActiveTab}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
        />
      </Tabs.TabPane>
    </Tabs>
  );
}

export default ClusterUsage;
