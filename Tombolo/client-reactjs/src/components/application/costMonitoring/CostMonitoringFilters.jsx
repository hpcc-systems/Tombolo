// Packages
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// Local imports
import './costMonitoring.css';
import { useSelector } from 'react-redux';
import useMonitoringFilters from '../../../hooks/useMonitoringFilters';
import AsrSpecificFilters from '../../common/Monitoring/AsrSpecificFilters';

//Constants
const { Option } = Select;

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
}) {
  const LOCAL_STORAGE_KEY = 'cMFilters';
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
  const [clusterOptions, setClusterOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

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
    const loadCostMonitoringFilters = (costMonitoring, filterOptions) => {
      const { clusterIds, metaData } = costMonitoring;
      // Cluster options
      if (clusterIds && clusterIds.length > 0 && clusters.length > 0) {
        clusterIds.forEach((clusterId) => {
          const cluster = clusters.find((c) => c.id === clusterId);
          if (cluster) {
            const existingClusters = filterOptions.clusters.map((c) => JSON.stringify(c));
            const currentCluster = { id: clusterId, name: cluster.name };
            if (!existingClusters.includes(JSON.stringify(currentCluster))) {
              filterOptions.clusters.push(currentCluster);
            }
          }
        });
      }

      // User options
      if (metaData && metaData.users && Array.isArray(metaData.users)) {
        metaData.users.forEach((user) => {
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
    const filterOptions = loadFilters(initialFilterOptions, costMonitorings, loadCostMonitoringFilters);

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setDomainOptions(filterOptions.domain);
    setProductOptions(filterOptions.products);
    setClusterOptions(filterOptions.clusters);
    setUserOptions(filterOptions.users);
  }, [costMonitorings, clusters, domains, allProductCategories, productCategories, selectedDomain, loadFilters]);

  //JSX
  return (
    <div className="notifications__filters">
      {filtersVisible && (
        <Form form={form} onValuesChange={handleFormChange} className="notifications__filters_form">
          <Row gutter={8}>
            <Col span={4}>
              <div className="notifications__filter-label">Monitoring Name</div>
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
              <div className="notifications__filter-label">Approval Status</div>
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
              <div className="notifications__filter-label">Active Status</div>
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

            <AsrSpecificFilters
              integrations={integrations}
              domainOptions={domainOptions}
              productOptions={productOptions}
              handleDomainChange={handleDomainChange}
            />

            <Col span={4}>
              <div className="notifications__filter-label">Clusters</div>
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

            <Col span={4}>
              <div className="notifications__filter-label">Users</div>
              <Form.Item name="users">
                <Select placeholder="Users" allowClear disabled={false} mode="multiple">
                  {userOptions.map((u) => (
                    <Option key={u} value={u}>
                      {u}
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
