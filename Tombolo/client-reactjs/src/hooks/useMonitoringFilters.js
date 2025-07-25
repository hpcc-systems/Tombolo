import { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';

const useMonitoringFilters = (
  form,
  setFiltersVisible,
  setFilters,
  setSelectedDomain,
  domains,
  productCategories,
  selectedDomain,
  allProductCategories,
  lsKey
) => {
  const [filterCount, setFilterCount] = useState(0);

  const calculateFilterCount = useCallback((filters) => {
    return Object.values(filters).filter(Boolean).length;
  }, []);

  useEffect(() => {
    // Load filter visibility from localStorage
    const filtersVisibility = localStorage.getItem(`${lsKey}Visible`);
    if (filtersVisibility) {
      setFiltersVisible(filtersVisibility === 'true');
    }

    // Load and apply filters from localStorage
    const existingFilters = localStorage.getItem(lsKey);
    if (existingFilters) {
      const filtersFromLocalStorage = JSON.parse(existingFilters);
      form.setFieldsValue(filtersFromLocalStorage);

      setFilterCount(calculateFilterCount(filtersFromLocalStorage));
    }
  }, [form, setFiltersVisible, calculateFilterCount, lsKey]);

  const debouncedHandleFormChange = debounce((form, setFilters, lsKey, setFilterCount, calculateFilterCount) => {
    const allFilters = form.getFieldsValue();
    setFilters(allFilters);
    localStorage.setItem(lsKey, JSON.stringify(allFilters));
    setFilterCount(calculateFilterCount(allFilters));
  }, 300);

  const handleFormChange = useCallback(
    () => debouncedHandleFormChange(form, setFilters, lsKey, setFilterCount, calculateFilterCount),
    [calculateFilterCount, debouncedHandleFormChange, form, lsKey, setFilters]
  );

  //Handle domain Change
  const handleDomainChange = useCallback(
    (domainId) => {
      setSelectedDomain(domainId);
      form.setFieldsValue({ product: '' });
    },
    [form, setSelectedDomain]
  );

  // Handle filter count click
  const handleFilterCountClick = useCallback(() => {
    setFiltersVisible(true);
  }, [setFiltersVisible]);

  // Clear filters when clear is clicked
  const clearFilters = useCallback(() => {
    form.resetFields();
    setFilterCount(0);
    setFilters({});
    // If exists, remove jMFilters from local storage
    if (localStorage.getItem(lsKey)) {
      localStorage.removeItem(lsKey);
    }
  }, [form, lsKey, setFilters]);

  const loadFilters = useCallback(
    (filterOptions, monitorings, loadSpecificFilters) => {
      // Ensure filterOptions has the necessary arrays initialized
      const updatedFilterOptions = {
        approvalStatus: filterOptions.approvalStatus || [],
        activeStatus: filterOptions.activeStatus || [],
        domain: filterOptions.domain || [],
        products: filterOptions.products || [],
      };

      // Process each monitoring item
      monitorings.forEach((monitoring) => {
        const { approvalStatus, isActive, metaData } = monitoring;

        // Approval Status options
        if (!updatedFilterOptions.approvalStatus.includes(approvalStatus)) {
          updatedFilterOptions.approvalStatus.push(approvalStatus);
        }

        // Active Status options
        const activeStatusString = isActive ? 'Active' : 'Inactive';
        if (!updatedFilterOptions.activeStatus.includes(activeStatusString)) {
          updatedFilterOptions.activeStatus.push(activeStatusString);
        }

        // Domain options
        const domainId = metaData?.asrSpecificMetaData?.domain || null;
        if (domainId && domains.length > 0) {
          const domainName = domains.find((d) => d.value === domainId)?.label || domainId;
          const existingDomains = updatedFilterOptions.domain.map((d) => JSON.stringify(d));
          const currentDomain = { id: domainId, name: domainName };
          if (!existingDomains.includes(JSON.stringify(currentDomain))) {
            updatedFilterOptions.domain.push(currentDomain);
          }
        }

        // Product options
        const productId = metaData?.asrSpecificMetaData?.productCategory || null;
        if (!selectedDomain && productId && allProductCategories.length > 0) {
          const product = allProductCategories.find((p) => p.id === productId);
          if (product) {
            const existingProducts = updatedFilterOptions.products.map((p) => JSON.stringify(p));
            const currentProduct = { id: productId, name: product.name };
            if (!existingProducts.includes(JSON.stringify(currentProduct))) {
              updatedFilterOptions.products.push(currentProduct);
            }
          }
        }

        if (selectedDomain && productId && productCategories.length > 0) {
          const product = productCategories.find((p) => p.value === productId);
          if (product) {
            const existingProducts = updatedFilterOptions.products.map((p) => JSON.stringify(p));
            const currentProduct = { id: productId, name: product.label };
            if (!existingProducts.includes(JSON.stringify(currentProduct))) {
              updatedFilterOptions.products.push(currentProduct);
            }
          }
        }

        // Execute the callback with the updated filter options
        if (typeof loadSpecificFilters === 'function') {
          loadSpecificFilters(monitoring, updatedFilterOptions);
        }
      });

      return updatedFilterOptions;
    },
    [allProductCategories, domains, productCategories, selectedDomain]
  );

  return {
    filterCount,
    setFilterCount,
    clearFilters,
    handleFilterCountClick,
    handleDomainChange,
    handleFormChange,
    loadFilters,
  };
};

export default useMonitoringFilters;
