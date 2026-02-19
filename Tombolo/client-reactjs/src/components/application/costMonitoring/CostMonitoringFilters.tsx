// Packages
import React, { useState, useEffect } from 'react';
import { Form } from 'antd';

// Local imports
import { useSelector } from 'react-redux';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';
import { Constants } from '@/components/common/Constants';
import type { CostMonitoringDTO } from '@tombolo/shared';

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  value: string;
  label: string;
}

interface Cluster {
  id: string;
  name: string;
  currencyCode?: string;
}

interface CostMonitoringFiltersProps {
  setFilters: (filters: any) => void;
  costMonitorings: CostMonitoringDTO[];
  clusters: Cluster[];
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  setSearchTerm: (term: string) => void;
  matchCount: number;
  searchTerm: string;
  domains: Domain[];
  setSelectedDomain: (domain: Domain | null) => void;
  selectedDomain: Domain | null;
  productCategories: ProductCategory[];
  allProductCategories: ProductCategory[];
}

interface FilterOption {
  label: string;
  value: string;
}

interface ClusterOption {
  id: string;
  name: string;
}

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
}: CostMonitoringFiltersProps) {
  //Redux
  const integrations = useSelector((state: any) => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState<FilterOption[]>([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState<FilterOption[]>([]);
  const [domainOptions, setDomainOptions] = useState<FilterOption[]>([]);
  const [productOptions, setProductOptions] = useState<FilterOption[]>([]);
  const [clusterOptions, setClusterOptions] = useState<ClusterOption[]>([]);
  const [userOptions, setUserOptions] = useState<string[]>([]);

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
      Constants.CM_FILTERS_KEY,
      Constants.CM_FILTERS_VS_KEY
    );

  useEffect(() => {
    const loadCostMonitoringFilters = (costMonitoring: any, filterOptions: any) => {
      const { clusterIds, metaData } = costMonitoring;
      // Cluster options
      if (clusterIds && clusterIds.length > 0 && clusters.length > 0) {
        clusterIds.forEach((clusterId: string) => {
          const cluster = clusters.find(c => c.id === clusterId);
          if (cluster) {
            const existingClusters = filterOptions.clusters.map((c: any) => JSON.stringify(c));
            const currentCluster = { id: clusterId, name: cluster.name };
            if (!existingClusters.includes(JSON.stringify(currentCluster))) {
              filterOptions.clusters.push(currentCluster);
            }
          }
        });
      }

      // User options
      if (metaData && metaData.users && Array.isArray(metaData.users)) {
        metaData.users.forEach((user: string) => {
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
    const filterOptions = loadFilters(initialFilterOptions, costMonitorings as any, loadCostMonitoringFilters);

    setApprovalStatusOptions(filterOptions.approvalStatus.map((s: string) => ({ label: s, value: s })));
    setActiveStatusOptions(filterOptions.activeStatus.map((s: string) => ({ label: s, value: s })));
    setDomainOptions(filterOptions.domain.map((d: any) => ({ label: d.name, value: d.id })));
    setProductOptions(filterOptions.products.map((p: any) => ({ label: p.name, value: p.id })));
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
        setSearchTerm={(v: string) => setSearchTerm(v)}
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
