// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form } from 'antd';

// Local imports
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';
import { Constants } from '@/components/common/Constants';
import type { JobMonitoringDTO } from '@tombolo/shared';
import type { DomainOption, ProductCategoryOption, ProductCategory } from './types';

interface NotificationTableFiltersProps {
  setFilters: (filters: any) => void;
  jobMonitorings: JobMonitoringDTO[];
  domains: DomainOption[];
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  productCategories: ProductCategoryOption[];
  allProductCategories: ProductCategory[];
  setProductCategories: (categories: ProductCategoryOption[]) => void;
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  setSearchTerm: (term: string) => void;
  matchCount: number;
  searchTerm: string;
  filters: any;
  isReader: boolean;
}

function NotificationTableFilters({
  setFilters,
  jobMonitorings,
  domains,
  selectedDomain,
  setSelectedDomain,
  productCategories,
  allProductCategories,
  setProductCategories,
  filtersVisible,
  setFiltersVisible,
  setSearchTerm,
  matchCount,
  searchTerm,
  filters,
  isReader,
}: NotificationTableFiltersProps) {
  //Redux
  const integrations = useSelector((state: any) => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState<any[]>([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState<any[]>([]);
  const [domainOptions, setDomainOptions] = useState<DomainOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductCategory[]>([]);
  const [frequencyOptions, setFrequencyOptions] = useState<string[]>([]);
  //Effects
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
      Constants.JM_FILTERS_KEY,
      Constants.JM_FILTERS_VS_KEY
    ) as any;

  useEffect(() => {
    const loadJobMonitoringFilters = async (jobMonitoring: any, filterOptions: any) => {
      const frequency = jobMonitoring?.metaData?.schedule[0].frequency || null;
      if (frequency && !filterOptions.frequency.includes(frequency)) {
        filterOptions.frequency.push(frequency);
      }
    };

    const initialFilterOptions = { approvalStatus: [], activeStatus: [], domain: [], products: [], frequency: [] };
    const filterOptions = loadFilters(initialFilterOptions, jobMonitorings, loadJobMonitoringFilters);

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setFrequencyOptions(filterOptions.frequency);
  }, [jobMonitorings, domains, allProductCategories, productCategories, selectedDomain, loadFilters]);

  // When the filter item changes

  //JSX
  return (
    <div className="notifications__filters">
      <MonitoringFilters
        form={form}
        filtersVisible={filtersVisible}
        onValuesChange={handleFormChange}
        searchLabel="Job Name / Monitoring Name"
        searchPlaceholder="Search by job name or monitoring name"
        searchTerm={searchTerm}
        setSearchTerm={v => setSearchTerm(v)}
        matchCount={matchCount}
        showAsr={true}
        showClusters={false}
        clustersMode="multiple"
        showUsers={false}
        showFrequency={true}
        options={{
          approvalStatusOptions,
          activeStatusOptions,
          domainOptions,
          productOptions,
          frequencyOptions,
        }}
        integrations={integrations}
        handleDomainChange={handleDomainChange}
        labelClassName="notifications__filter_label"
        className="notifications__filters_form"
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

export default NotificationTableFilters;
