// Packages
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

// Local imports
import './costMonitoring.css';

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
}) {
  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [approvalStatusOptions, setApprovalStatusOptions] = useState([]);
  const [activeStatusOptions, setActiveStatusOptions] = useState([]);
  const [clusterOptions, setClusterOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [filterCount, setFilterCount] = useState(0);

  //Effects
  useEffect(() => {
    // Display filters if true in local storage
    const filtersVisibility = localStorage.getItem('cMFiltersVisible');
    const existingFilters = localStorage.getItem('cMFilters');

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
    const filterOptions = { approvalStatus: [], activeStatus: [], clusters: [], users: [] };

    costMonitorings.forEach((monitoring) => {
      const { approvalStatus, isActive, clusterIds, metaData } = monitoring;

      // Approval Status options
      if (!filterOptions.approvalStatus.includes(approvalStatus)) {
        filterOptions.approvalStatus.push(approvalStatus);
      }

      // Active Status options
      const activeStatusString = isActive ? 'Active' : 'Inactive';
      if (!filterOptions.activeStatus.includes(activeStatusString)) {
        filterOptions.activeStatus.push(activeStatusString);
      }

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
    });

    setApprovalStatusOptions(filterOptions.approvalStatus);
    setActiveStatusOptions(filterOptions.activeStatus);
    setClusterOptions(filterOptions.clusters);
    setUserOptions(filterOptions.users);
  }, [costMonitorings, clusters]);

  // When the filter item changes
  const handleFormChange = () => {
    const allFilters = form.getFieldsValue();
    setFilters(allFilters);

    localStorage.setItem('cMFilters', JSON.stringify(allFilters));

    // Set new filter count
    let count = 0;
    for (let keys of Object.keys(allFilters)) {
      if (allFilters[keys]) {
        count++;
      }
    }
    setFilterCount(count);
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
    // If exists remove cMFilters from local storage
    if (localStorage.getItem('cMFilters')) {
      localStorage.removeItem('cMFilters');
    }
  };

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
