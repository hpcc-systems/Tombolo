// Packages
import React, { useState, useEffect } from 'react';
import { Form } from 'antd';

// Local imports
import { useSelector } from 'react-redux';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';
import { Constants } from '@/components/common/Constants';

function CostMonitoringFilters({
  setFilters,
  costMonitorings,
  clusters,
  filtersVisible,
  setFiltersVisible,
  setSearchTerm,
  matchCount,
  searchTerm,
  domains,
  setSelectedDomain,
  selectedDomain,
  productCategories,
  allProductCategories,
}) {
  //Redux
  const integrations = useSelector((state) => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [clusterOptions, setClusterOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  const { filterCount, clearFilters, handleFilterCountClick, handleDomainChange, handleFormChange, loadFilters } =
    useMonitoringFilters(
      form,
      setFiltersVisible,
      setFilters,
      setSelectedDomain,
      domains,
      productCategories,
      selectedDomain,
      allProductCategories,
      Constants.CM_FILTERS_KEY,
      Constants.CM_FILTERS_VS_KEY
    );

  useEffect(() => {
    const loadCostMonitoringFilters = (costMonitoring, filterOptions) => {
      const { clusterIds, metaData } = costMonitoring;
      // Cluster options
      if (clusterIds && clusterIds.length > 0 && clusters.length > 0) {
        clusterIds.forEach((clusterId) => {
          const cluster = clusters.find((c) => c.id === clusterId);
          if (cluster) {
            const existingClusters = filterOptions.clusters.map((c) => JSON.stringify(c));
            const currentCluster = { id: clusterId, name: cluster.name };
            if (!existingClusters.includes(JSON.stringify(currentCluster))) {
              filterOptions.clusters.push(currentCluster);
            }
          }
        });
      }

      // User options
      if (metaData && metaData.users && Array.isArray(metaData.users)) {
        metaData.users.forEach((user) => {
          if (user !== '*' && !filterOptions.users.includes(user)) {
            filterOptions.users.push(user);
          }
        });
      }
    };

    const initialFilterOptions = {
      approvalStatus: [],
      activeStatus: [],
      domain: [],
      products: [],
      clusters: [],
      users: [],
    };
    const filterOptions = loadFilters(initialFilterOptions, costMonitorings, loadCostMonitoringFilters);

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setClusterOptions(filterOptions.clusters);
    setUserOptions(filterOptions.users);
  }, [costMonitorings, clusters, domains, allProductCategories, productCategories, selectedDomain, loadFilters]);

  //JSX
  return (
    <div className="notifications__filters">
      <MonitoringFilters
        form={form}
        filtersVisible={filtersVisible}
        onValuesChange={handleFormChange}
        searchLabel="Monitoring Name"
        searchPlaceholder="Search by monitoring name"
        searchTerm={searchTerm}
        setSearchTerm={(v) => setSearchTerm(v)}
        matchCount={matchCount}
        showAsr={true}
        showClusters={true}
        clustersMode="multiple"
        showUsers={true}
        showFrequency={false}
        options={{
          approvalStatusOptions,
          activeStatusOptions,
          domainOptions,
          productOptions,
          clusterOptions,
          userOptions,
        }}
        integrations={integrations}
        handleDomainChange={handleDomainChange}
        className={undefined}
        labelClassName="notifications__filter_label"
      />

      {filterCount > 0 && !filtersVisible && (
        <div className="notification__filters_count">
          <div style={{ cursor: 'pointer' }}>
            <span style={{ color: 'var(--danger)' }}>{`${filterCount} filter(s) active`}</span>
            <span style={{ color: 'var(--primary)', paddingLeft: '5px' }} onClick={handleFilterCountClick}>
              - View
            </span>
            <span style={{ color: 'var(--primary)', paddingLeft: '5px' }} onClick={clearFilters}>
              {' '}
              | Clear
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CostMonitoringFilters;
