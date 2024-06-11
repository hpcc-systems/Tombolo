// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, Select, Button } from 'antd';
import _ from 'lodash';

// Local imports
import './jobMonitoring.css';

//Constants
const { Option } = Select;

function NotificationTableFilters({
  filters,
  setFilters,
  jobMonitorings,
  domains,
  selectedDomain,
  setSelectedDomain,
  productCategories,
  allProductCategories,
  filtersVisible,
  setFiltersVisible,
}) {
  //Redux
  const {
    applicationReducer: { integrations },
  } = useSelector((state) => state);

  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [frequencyOptions, setFrequencyOptions] = useState([]);
  const [filterCount, setFilterCount] = useState(4);

  console.count('NotificationTableFilters');

  //Effects
  useEffect(() => {
    // Display filters if true in local storage
    const filtersVisibility = localStorage.getItem('jMFiltersVisible');
    if (filtersVisibility) {
      setFiltersVisible(filtersVisibility === 'true');
    }
  }, []);

  useEffect(() => {
    const filterOptions = { approvalStatus: [], activeStatus: [], domain: [], products: [], frequency: [] };
    jobMonitorings.forEach((monitoring) => {
      const { approvalStatus, isActive } = monitoring;

      if (!filterOptions.approvalStatus.includes(approvalStatus)) {
        filterOptions.approvalStatus.push(approvalStatus);
      }

      const activeStatusString = isActive ? 'Active' : 'Inactive';
      if (!filterOptions.activeStatus.includes(activeStatusString)) {
        filterOptions.activeStatus.push(activeStatusString);
      }

      const domainId = monitoring?.metaData?.asrSpecificMetaData?.domain || null;
      if (domainId && domains.length > 0) {
        const domainName = domains.find((d) => d.value === domainId)?.label || domainId;
        const existingDomains = filterOptions.domain.map((d) => JSON.stringify(d));
        const currentDomain = { id: domainId, name: domainName };
        if (!existingDomains.includes(JSON.stringify(currentDomain))) {
          filterOptions.domain.push(currentDomain);
        }
      }

      const productId = monitoring?.metaData?.asrSpecificMetaData?.productCategory || null;
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

      if (selectedDomain && productId && productCategories.length > 0) {
        const product = productCategories.find((p) => p.value === productId);
        if (product) {
          const existingProducts = filterOptions.products.map((p) => JSON.stringify(p));
          const currentProduct = { id: productId, name: product.label };
          if (!existingProducts.includes(JSON.stringify(currentProduct))) {
            filterOptions.products.push(currentProduct);
          }
        }
      }

      const frequency = monitoring?.metaData?.schedule[0].frequency || null;
      if (frequency && !filterOptions.frequency.includes(frequency)) {
        filterOptions.frequency.push(frequency);
      }
    });

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setFrequencyOptions(filterOptions.frequency);
  }, [jobMonitorings, domains, allProductCategories, productCategories, selectedDomain]);

  // When the filter item changes
  const handleFormChange = (changedValues) => {
    const allFilters = { ...filters, ...changedValues };
    setFilters(allFilters);

    let filtersLength = 0;
    Object.keys(allFilters).forEach((key) => {
      if (allFilters[key] !== undefined) {
        filtersLength++;
      }
    });
    setFilterCount(filtersLength);
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

  //JSX
  return (
    <div className="notifications__filters">
      {filtersVisible && (
        <Form form={form} onValuesChange={handleFormChange} className="notifications__filters_form">
          <Row gutter={16}>
            <Col span={4}>
              <div className="notifications__filter-label">Approval Status</div>
              <Form.Item name="approvalStatus">
                <Select placeholder="Approval Status" allowClear>
                  {approvalStatusOptions.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={5}>
              <div className="notifications__filter-label">Active Status</div>
              <Form.Item name="activeStatus">
                <Select placeholder="Active statues" allowClear>
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
                <Col span={5}>
                  <div className="notifications__filter-label">Domain</div>
                  <Form.Item name="domain">
                    <Select
                      placeholder="Domain"
                      allowClear
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
                <Col span={5} name="product">
                  <div className="notifications__filter-label">Product</div>
                  <Form.Item name="product">
                    <Select placeholder="Product" allowClear>
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
            <Col span={5}>
              <div className="notifications__filter-label">Frequency</div>
              <Form.Item name="frequency">
                <Select placeholder="Frequency" allowClear>
                  {frequencyOptions.map((f) => (
                    <Option key={f} value={f}>
                      {_.startCase(f)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}

      {filterCount > 0 && !filtersVisible && (
        <div className="notification__filters_count">
          <Button size="small" type="link" danger onClick={handleFilterCountClick}>
            {`${filterCount} Filter${filterCount > 1 ? 's' : ''} applied `}
            <span style={{ color: 'var(--primary)', paddingLeft: '5px' }}> {' - Click to view'}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationTableFilters;
