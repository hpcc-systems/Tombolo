// Packages
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// Local imports
import { useSelector } from 'react-redux';
import useMonitoringFilters from '../../../hooks/useMonitoringFilters';
import AsrSpecificFilters from '../../common/Monitoring/AsrSpecificFilters';

//Constants
const { Option } = Select;

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
  const LOCAL_STORAGE_KEY = 'clusterMonitoringFilters';
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
      LOCAL_STORAGE_KEY
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
      {filtersVisible && (
        <Form form={form} onValuesChange={handleFormChange}>
          <Row gutter={8}>
            <Col span={4}>
              <div className="notifications__filter_label">Monitoring Name</div>
              <Input
                placeholder="Search by monitoring name"
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
                  setSearchTerm(e.target.value.toLowerCase());
                }}
                allowClear
                disabled={false}
              />
            </Col>
            <Col span={4}>
              <div className="notifications__filter_label">Approval Status</div>
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
              <div className="notifications__filter_label">Active Status</div>
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
            <Col span={4}>
              <div className="notifications__filter_label">Clusters</div>
              <Form.Item name="clusters">
                <Select placeholder="Clusters" allowClear disabled={false} mode="multiple">
                  {clusterOptions.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <AsrSpecificFilters
              integrations={integrations}
              domainOptions={domainOptions}
              productOptions={productOptions}
              handleDomainChange={handleDomainChange}
            />
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

export default CostMonitoringFilters;
