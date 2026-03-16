import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { Tabs } from 'antd';
import GraphExpanded from './charts/GraphExpanded';
import StorageUsageHistoryCharts from './charts/StorageUsageHistoryCharts';
import Filters from './charts/Filters';
import CurrentClusterUsageCharts from './charts/CurrentClusterUsageCharts';
import ExportMenu from '../ExportMenu/ExportMenu';
import { getQueryParamsFromUrl, addQueriesToUrl } from '../../../common/AddQueryToUrl';
import clusterService from '@/services/cluster.service';
import { handleError } from '@/components/common/handleResponse';

const ClusterUsage: React.FC = () => {
  const [clusterUsageHistory, setClusterUsageHistory] = useState<any>({});
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [historyDateRange, setHistoryDateRange] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [viewExpandedGraph, setViewExpandedGraph] = useState(false);
  const [expandedGraphData, setExpandedGraphData] = useState<any[]>([]);
  const [clusterOptions, setClusterOptions] = useState<any[]>([]);
  const clusters = useSelector((state: any) => state.application.clusters);

  useEffect(() => {
    const urlQueries = getQueryParamsFromUrl();

    if (urlQueries.clusterId) setSelectedCluster(urlQueries.clusterId);

    if (clusters?.length && !urlQueries.clusterId) {
      setSelectedCluster(clusters[0].id);
      addQueriesToUrl({ queryName: 'clusterId', queryValue: clusters[0].id });
    }

    if (urlQueries.activeTab) setActiveTab(urlQueries.activeTab);
    else {
      setActiveTab('1');
      addQueriesToUrl({ queryName: 'activeTab', queryValue: '1' });
    }

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
      const options = clusters.map((cluster: any) => ({ label: cluster.name, value: cluster.id }));
      setClusterOptions(options);
    }
  }, [clusters]);

  const handleTabSwitching = (tab: string) => {
    addQueriesToUrl({ queryName: 'activeTab', queryValue: tab });
    setActiveTab(tab);
  };

  useEffect(() => {
    if (selectedCluster && historyDateRange) getClusterUsageHistory(selectedCluster);
  }, [selectedCluster, historyDateRange]);

  const getClusterUsageHistory = async (clusterId: any) => {
    try {
      const queryData = JSON.stringify({ clusterId, historyDateRange });
      const data = await clusterService.getClusterStorageHistory(queryData);
      setClusterUsageHistory(data);
    } catch (err) {
      setClusterUsageHistory([]);
      handleError(err);
    }
  };

  return (
    <Tabs
      tabBarExtraContent={<ExportMenu selectedCluster={selectedCluster} />}
      activeKey={activeTab || undefined}
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
};

export default ClusterUsage;
