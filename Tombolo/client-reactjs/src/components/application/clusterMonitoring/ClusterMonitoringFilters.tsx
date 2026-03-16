// Packages
import React, { useState, useEffect } from 'react';
import { Form } from 'antd';

// Local imports
import { useSelector } from 'react-redux';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';
import { Constants } from '../../common/Constants';
import type { ClusterMonitoringDTO } from '@tombolo/shared';

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  value: string;
  label: string;
}

interface ClusterMonitoringFiltersProps {
  clusterMonitoring: ClusterMonitoringDTO[];
  setFilters: (filters: any) => void;
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  matchCount: number;
  domains: Domain[];
  selectedDomain: Domain | null;
  setSelectedDomain: (domain: string | null) => void;
  productCategories: ProductCategory[];
  allProductCategories: ProductCategory[];
}

interface ApprovalStatusOption {
  label: string;
  value: string;
}

interface ActiveStatusOption {
  label: string;
  value: string;
}

interface DomainOption {
  label: string;
  value: string;
}

interface ProductOption {
  label: string;
  value: string;
}

interface ClusterOption {
  id: string;
  name: string;
}

function ClusterMonitoringFilters({
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
}: ClusterMonitoringFiltersProps) {
  //Redux
  const integrations = useSelector((state: any) => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState<ApprovalStatusOption[]>([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState<ActiveStatusOption[]>([]);
  const [domainOptions, setDomainOptions] = useState<DomainOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [clusterOptions, setClusterOptions] = useState<ClusterOption[]>([]);

  const { filterCount, clearFilters, handleFilterCountClick, handleDomainChange, handleFormChange, loadFilters } =
    useMonitoringFilters(
      form,
      setFiltersVisible,
      setFilters,
      setSelectedDomain as any,
      domains,
      productCategories,
      selectedDomain as any,
      allProductCategories as any,
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

    let filterOptions = loadFilters(initialFilterOptions, clusterMonitoring as any);

    // Unique clusters
    const uniqueClusterIds: string[] = [];
    const uniqueClusterObjs: ClusterOption[] = [];
    clusterMonitoring.forEach(c => {
      if (!uniqueClusterIds.includes(c.clusterId)) {
        uniqueClusterIds.push(c.clusterId);
        uniqueClusterObjs.push({ id: c.clusterId, name: c.cluster?.name || '' });
      }
    });

    setApprovalStatusOptions(filterOptions.approvalStatus.map((s: string) => ({ label: s, value: s })));
    setActiveStatusOptions(filterOptions.activeStatus.map((s: string) => ({ label: s, value: s })));
    setDomainOptions(filterOptions.domain.map((d: any) => ({ label: d.name, value: d.id })));
    setProductOptions(filterOptions.products.map((p: any) => ({ label: p.name, value: p.id })));
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
        setSearchTerm={(v: string) => setSearchTerm(v)}
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

export default ClusterMonitoringFilters;
