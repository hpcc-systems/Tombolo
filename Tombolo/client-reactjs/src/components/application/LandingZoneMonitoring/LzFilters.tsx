import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'antd';
import { Constants } from '../../common/Constants';

// Local imports
import styles from './lzMonitoring.module.css';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';

interface Props {
  setFilters: (f: any) => void;
  domains: any[];
  selectedDomain: string | null;
  setSelectedDomain: (d: string | null) => void;
  allProductCategories: any[];
  filtersVisible: boolean;
  setFiltersVisible: (v: boolean) => void;
  setSearchTerm: (s: string) => void;
  matchCount: number;
  searchTerm: string;
  landingZoneMonitoring: any[];
}

function LzFilters({
  setFilters,
  domains,
  selectedDomain,
  setSelectedDomain,
  allProductCategories,
  filtersVisible,
  setFiltersVisible,
  setSearchTerm,
  matchCount,
  searchTerm,
  landingZoneMonitoring,
}: Props) {
  //Redux
  const integrations = useSelector((state: any) => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [clusterOptions, setClusterOptions] = useState<any[]>([]);
  const [approvalStatusOptions, setApprovalStatusOptions] = useState<any[]>([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState<any[]>([]);
  const [domainOptions, setDomainOptions] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const { filterCount, clearFilters, handleFilterCountClick, handleDomainChange, handleFormChange, loadFilters } =
    useMonitoringFilters(
      form,
      setFiltersVisible,
      setFilters,
      setSelectedDomain as any,
      domains,
      [],
      selectedDomain,
      allProductCategories,
      Constants.LZM_FILTERS_KEY,
      Constants.LZM_FILTERS_VS_KEY
    );

  useEffect(() => {
    const initialFilterOptions = { approvalStatus: [], activeStatus: [], domain: [], products: [], clusters: [] };
    const filterOptions = loadFilters(initialFilterOptions, landingZoneMonitoring, (monitoring: any, fo: any) => {
      const cluster = monitoring.cluster || {};
      if (monitoring.clusterId) {
        const current = { ...cluster, id: monitoring.clusterId };
        const exists = fo.clusters.find((c: any) => c.id === current.id);
        if (!exists) {
          fo.clusters.push(current);
        }
      }
    });

    setApprovalStatusOptions(filterOptions.approvalStatus.map((s: string) => ({ label: s, value: s })));
    setActiveStatusOptions(filterOptions.activeStatus.map((s: string) => ({ label: s, value: s })));
    setDomainOptions(filterOptions.domain.map((d: any) => ({ label: d.name, value: d.id })));
    setProductOptions(filterOptions.products.map((p: any) => ({ label: p.name, value: p.id })));
    setClusterOptions(filterOptions.clusters);
  }, [landingZoneMonitoring, domains, allProductCategories, selectedDomain]);

  return (
    <div>
      <MonitoringFilters
        form={form}
        filtersVisible={filtersVisible}
        onValuesChange={handleFormChange}
        searchLabel="Monitoring Name"
        searchPlaceholder="Search monitoring name"
        searchTerm={searchTerm}
        setSearchTerm={(v: string) => setSearchTerm(v)}
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

export default LzFilters;
