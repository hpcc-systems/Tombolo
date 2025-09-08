// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'antd';
import { Constants } from '../../common/Constants';

// Local imports
import styles from './fileMonitoring.module.css';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';

function FileMonitoringFilters({
  fileMonitoring,
  setFilters,
  filtersVisible,
  setFiltersVisible,
  searchTerm,
  setSearchTerm,
  matchCount,
  domains,
  allProductCategories,
  selectedDomain,
  setSelectedDomain,
}) {
  //Redux
  const integrations = useSelector((state) => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [clusterOptions, setClusterOptions] = useState([]);
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const { filterCount, clearFilters, handleFilterCountClick, handleDomainChange, handleFormChange, loadFilters } =
    useMonitoringFilters(
      form,
      setFiltersVisible,
      setFilters,
      setSelectedDomain,
      domains,
      [],
      selectedDomain,
      allProductCategories,
      Constants.FM_FILTERS_KEY,
      Constants.FM_FILTERS_VS_KEY
    );

  useEffect(() => {
    const initialFilterOptions = { approvalStatus: [], activeStatus: [], domain: [], products: [], clusters: [] };
    const filterOptions = loadFilters(initialFilterOptions, fileMonitoring, (monitoring, fo) => {
      const cluster = monitoring.cluster || {};
      if (monitoring.clusterId) {
        const current = { ...cluster, id: monitoring.clusterId };
        const exists = fo.clusters.find((c) => c.id === current.id);
        if (!exists) {
          fo.clusters.push(current);
        }
      }
    });

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setClusterOptions(filterOptions.clusters);
  }, [fileMonitoring, domains, allProductCategories, selectedDomain]);

  return (
    <div>
      <MonitoringFilters
        form={form}
        filtersVisible={filtersVisible}
        onValuesChange={handleFormChange}
        searchLabel="Monitoring Name"
        searchPlaceholder="Search monitoring name"
        searchTerm={searchTerm}
        setSearchTerm={(v) => setSearchTerm(v)}
        matchCount={matchCount}
        showAsr={true}
        showClusters={true}
        clustersMode="single"
        options={{
          approvalStatusOptions,
          activeStatusOptions,
          domainOptions,
          productOptions,
          clusterOptions,
        }}
        integrations={integrations}
        handleDomainChange={handleDomainChange}
        className={styles.lz__filters_form}
        labelClassName={styles.lz__filterLabel}
      />
      {filterCount > 0 && !filtersVisible && (
        <div className={styles.notification__filters_count}>
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

export default FileMonitoringFilters;
