// Packages
import React, { useState, useEffect } from 'react';
import { Form } from 'antd';

// Local imports
import { useSelector } from 'react-redux';
import useMonitoringFilters from '@/hooks/useMonitoringFilters';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters';
import { Constants } from '@/components/common/Constants';

function OrbitProfileMonitoringFilters({
  setFilters,
  orbitMonitorings,
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
  const integrations = useSelector(state => state.application.integrations);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [creatorOptions, setCreatorOptions] = useState([]);

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
      Constants.OPM_FILTERS_KEY,
      Constants.OPM_FILTERS_VS_KEY
    );

  useEffect(() => {
    const loadOrbitProfileMonitoringFilters = (orbitMonitoring, filterOptions) => {
      // Add creator to filter options
      if (orbitMonitoring.creator) {
        const creatorName = `${orbitMonitoring.creator.firstName} ${orbitMonitoring.creator.lastName}`;
        const creatorId = orbitMonitoring.creator.id;
        const existingCreators = filterOptions.creators.map(c => JSON.stringify(c));
        const currentCreator = { id: creatorId, name: creatorName };
        if (!existingCreators.includes(JSON.stringify(currentCreator))) {
          filterOptions.creators.push(currentCreator);
        }
      }
    };

    const initialFilterOptions = {
      approvalStatus: [],
      activeStatus: [],
      domain: [],
      products: [],
      creators: [],
    };
    const filterOptions = loadFilters(initialFilterOptions, orbitMonitorings, loadOrbitProfileMonitoringFilters);

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setCreatorOptions(filterOptions.creators);
  }, [orbitMonitorings, domains, allProductCategories, productCategories, selectedDomain, loadFilters]);

  //JSX
  return (
    <div className="notifications__filters">
      <MonitoringFilters
        form={form}
        filtersVisible={filtersVisible}
        onValuesChange={handleFormChange}
        searchLabel="Monitoring Name / Build Name"
        searchPlaceholder="Search by monitoring name or build name"
        searchTerm={searchTerm}
        setSearchTerm={v => setSearchTerm(v)}
        matchCount={matchCount}
        showAsr={true}
        showClusters={false}
        clustersMode="multiple"
        showUsers={false}
        showFrequency={false}
        showCreators={true}
        options={{
          approvalStatusOptions,
          activeStatusOptions,
          domainOptions,
          productOptions,
          creatorOptions,
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

export default OrbitProfileMonitoringFilters;
