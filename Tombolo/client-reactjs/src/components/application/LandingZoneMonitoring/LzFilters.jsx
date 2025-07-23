/* eslint-disable */
// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import _, { set } from 'lodash';

// Local imports
import './lzMonitoring.css';
import { use } from 'react';

//Constants
const { Option } = Select;

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
}) {
  //Redux
  const {
    applicationReducer: { integrations },
  } = useSelector((state) => state);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [clusterOptions, setClusterOptions] = useState([]);
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [filterCount, setFilterCount] = useState(0);

  //Effects
  useEffect(() => {
    // Display filters if true in local storage
    const filtersVisibility = localStorage.getItem('jMFiltersVisible');
    const existingFilters = localStorage.getItem('jMFilters');

    if (filtersVisibility) {
      setFiltersVisible(filtersVisibility === 'true');
    }

    if (existingFilters) {
      const filtersFromLocalStorage = JSON.parse(existingFilters);
      form.setFieldsValue(filtersFromLocalStorage);
      let count = 0;

      // Set filter count
      for (let keys of Object.keys(filtersFromLocalStorage)) {
        if (filtersFromLocalStorage[keys]) {
          count++;
        }
      }

      setFilterCount(count);
    }
  }, []);

  useEffect(() => {
    const filterOptions = { approvalStatus: [], activeStatus: [], domain: [], products: [], clusters: [] };
    const filterClustersDetails = [];

    landingZoneMonitoring.forEach((monitoring) => {
      const { approvalStatus, isActive } = monitoring;

      if (!filterOptions.approvalStatus.includes(approvalStatus)) {
        filterOptions.approvalStatus.push(approvalStatus);
      }

      const activeStatusString = isActive ? 'Active' : 'Inactive';
      if (!filterOptions.activeStatus.includes(activeStatusString)) {
        filterOptions.activeStatus.push(activeStatusString);
      }

      const domainId = monitoring['metaData.asrSpecificMetaData.domain'] || null;
      if (domainId && domains.length > 0) {
        const domainName = domains.find((d) => d.value === domainId)?.label || domainId;
        const existingDomains = filterOptions.domain.map((d) => JSON.stringify(d));
        const currentDomain = { id: domainId, name: domainName };
        if (!existingDomains.includes(JSON.stringify(currentDomain))) {
          filterOptions.domain.push(currentDomain);
        }
      }

      const productId = monitoring['metaData.asrSpecificMetaData.productCategory'] || null;
      if (!selectedDomain && productId && allProductCategories.length > 0) {
        const product = allProductCategories.find((p) => p.id === productId);
        if (product) {
          const existingProducts = filterOptions.products.map((p) => JSON.stringify(p));
          const currentProduct = { id: productId, name: product.name };
          if (!existingProducts.includes(JSON.stringify(currentProduct))) {
            filterOptions.products.push(currentProduct);
          }
        }
      }

      if (selectedDomain && productId && allProductCategories.length > 0) {
        const product = allProductCategories.find((p) => p.value === productId);
        if (product) {
          const existingProducts = filterOptions.products.map((p) => JSON.stringify(p));
          const currentProduct = { id: productId, name: product.label };
          if (!existingProducts.includes(JSON.stringify(currentProduct))) {
            filterOptions.products.push(currentProduct);
          }
        }
      }

      const cluster = monitoring.cluster || {};
      if (monitoring.clusterId && !filterOptions.clusters.includes(monitoring.clusterId)) {
        filterOptions.clusters.push(monitoring.clusterId);
        filterClustersDetails.push({ ...cluster, id: monitoring.clusterId });
      }
    });

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    const uniqueClusters = new Set(filterClustersDetails);
    setClusterOptions([...uniqueClusters]);
  }, [landingZoneMonitoring, domains, allProductCategories, allProductCategories, selectedDomain]);

  // When the filter item changes
  const handleFormChange = () => {
    const allFilters = form.getFieldsValue();
    setFilters(allFilters);

    localStorage.setItem('jMFilters', JSON.stringify(allFilters));

    // Set new filter count
    let count = 0;
    for (let keys of Object.keys(allFilters)) {
      if (allFilters[keys]) {
        count++;
      }
    }
    setFilterCount(count);
  };

  //Handle domain Change
  const handleDomainChange = (domainId) => {
    setSelectedDomain(domainId);
    form.setFieldsValue({ product: '' });
  };

  // Handle filter count click
  const handleFilterCountClick = () => {
    setFiltersVisible(true);
  };

  // Clear filters when clear is clicked
  const clearFilters = () => {
    form.resetFields();
    setFilterCount(0);
    setFilters({});
    // If exists remove jMFilters from local storage
    if (localStorage.getItem('jMFilters')) {
      localStorage.removeItem('jMFilters');
    }
  };

  //JSX
  return (
    <div className="lz__filters">
      {filtersVisible && (
        <Form form={form} onValuesChange={handleFormChange} className="lz__filters_form">
          <Row gutter={8}>
            <Col span={4}>
              <div className="lz__filter-label">Monitoring Name</div>
              <Input
                placeholder="Search monitoring name"
                prefix={<SearchOutlined />}
                suffix={
                  searchTerm ? (
                    <span style={{ color: matchCount > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      {matchCount} match{matchCount > 1 ? 'es' : ''}{' '}
                    </span>
                  ) : (
                    ''
                  )
                }
                onChange={(e) => {
                  setSearchTerm(e.target.value.toLocaleLowerCase());
                }}
                allowClear
                disabled={false}
              />
            </Col>

            <Col span={4}>
              <div className="lz__filter-label">Cluster</div>
              <Form.Item name="cluster">
                <Select placeholder="Cluster" allowClear disabled={false}>
                  {clusterOptions.map((f) => (
                    <Option key={f.id} value={f.id}>
                      {_.startCase(f.name)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <div className="lz__filter-label">Approval Status</div>
              <Form.Item name="approvalStatus">
                <Select placeholder="Approval Status" allowClear disabled={false}>
                  {approvalStatusOptions.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <div className="lz__filter-label">Active Status</div>
              <Form.Item name="activeStatus">
                <Select placeholder="Active statuses" allowClear disabled={false}>
                  {activeStatusOptions.map((a) => (
                    <Option key={a} value={a}>
                      {a}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {integrations.some((i) => i.name === 'ASR') && (
              <>
                <Col span={4}>
                  <div className="lz__filter-label">Domain</div>
                  <Form.Item name="domain">
                    <Select
                      placeholder="Domain"
                      allowClear
                      disabled={false}
                      onChange={(domainId) => {
                        handleDomainChange(domainId);
                      }}>
                      {domainOptions.map((d) => (
                        <Option key={d.id} value={d.id}>
                          {d.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4} name="product">
                  <div className="lz__filter-label">Product</div>
                  <Form.Item name="product">
                    <Select placeholder="Product" allowClear disabled={false}>
                      {productOptions.map((p) => (
                        <Option key={p.id} value={p.id}>
                          {p.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
      )}
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

export default LzFilters;
