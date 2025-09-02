// Packages
import React, { useState, useEffect } from 'react';
import { Form } from 'antd';

// Local imports
import { useSelector } from 'react-redux';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';
import { Constants } from '../../common/Constants';

function CostMonitoringFilters({
  clusterMonitoring,
  setFilters,
  filtersVisible,
  setFiltersVisible,
  searchTerm,
  setSearchTerm,
  matchCount,
  domains,
  selectedDomain,
  setSelectedDomain,
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
      Constants.CLUSTER_M_FILTERS_KEY,
      Constants.CLUSTER_M_FILTERS_VS_KEY
    );

  useEffect(() => {
    const initialFilterOptions = {
      approvalStatus: [],
      activeStatus: [],
      domain: [],
      products: [],
    };

    let filterOptions = loadFilters(initialFilterOptions, clusterMonitoring);

    // Unique clusters
    const uniqueClusterIds = [];
    const uniqueClusterObjs = [];
    clusterMonitoring.forEach((c) => {
      if (!uniqueClusterIds.includes(c.clusterId)) {
        uniqueClusterIds.push(c.clusterId);
        uniqueClusterObjs.push({ id: c.cluster.id, name: c.cluster.name });
      }
    });

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setClusterOptions(uniqueClusterObjs);
  }, [clusterMonitoring, domains, allProductCategories, productCategories, selectedDomain, loadFilters]);

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
        showUsers={false}
        showFrequency={false}
        options={{
          approvalStatusOptions,
          activeStatusOptions,
          domainOptions,
          productOptions,
          clusterOptions,
        }}
        integrations={integrations}
        handleDomainChange={handleDomainChange}
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
