// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import _ from 'lodash';

// Local imports
import './jobMonitoring.css';
import useMonitoringFilters from '../../../hooks/useMonitoringFilters';
import AsrSpecificFilters from '../../common/Monitoring/AsrSpecificFilters';

//Constants
const { Option } = Select;

function NotificationTableFilters({
  setFilters,
  jobMonitorings,
  domains,
  selectedDomain,
  setSelectedDomain,
  productCategories,
  allProductCategories,
  filtersVisible,
  setFiltersVisible,
  setSearchTerm,
  matchCount,
  searchTerm,
}) {
  const LOCAL_STORAGE_KEY = 'jMFilters';
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
      LOCAL_STORAGE_KEY
    );

  useEffect(() => {
    const loadJobMonitoringFilters = async (jobMonitoring, filterOptions) => {
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
      {filtersVisible && (
        <Form form={form} onValuesChange={handleFormChange} className="notifications__filters_form">
          <Row gutter={8}>
            <Col span={4}>
              <div className="notifications__filter-label">Job Name / Monitoring Name</div>
              <Input
                placeholder="Search by job name or monitoring name"
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
              <div className="notifications__filter-label">Frequency</div>
              <Form.Item name="frequency">
                <Select placeholder="Frequency" allowClear disabled={false}>
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
