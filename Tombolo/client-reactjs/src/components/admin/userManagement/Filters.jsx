import React, { useState, useEffect } from 'react';

import { Form, Row, Col, Select } from 'antd';

//Constants
const { Option } = Select;

const UserFilters = ({ setFilters, users, filtersVisible, setFiltersVisible }) => {
  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [roleOptions, setRoleOptions] = useState([]);
  const [applicationOptions, setApplicationOptions] = useState([]);
  const [filterCount, setFilterCount] = useState(0);

  //Effects
  useEffect(() => {
    // Display filters if true in local storage
    const filtersVisibility = localStorage.getItem('userFiltersVisible');
    const existingFilters = localStorage.getItem('userFilters');

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
    const filterOptions = { role: [], application: [] };
    users.forEach((user) => {
      const { role, application } = user;

      if (!filterOptions.role.includes(role)) {
        filterOptions.role.push(role);
      }
      if (!filterOptions.application.includes(application)) {
        filterOptions.application.push(application);
      }
    });

    setRoleOptions(filterOptions.role);
    setApplicationOptions(filterOptions.application);
  }, [users]);

  // When the filter item changes
  const handleFormChange = () => {
    const allFilters = form.getFieldsValue();
    setFilters(allFilters);

    localStorage.setItem('userFilters', JSON.stringify(allFilters));

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
    // If exists remove userFilters from local storage
    if (localStorage.getItem('userFilters')) {
      localStorage.removeItem('userFilters');
    }
  };

  //JSX
  return (
    <div className="notifications__filters">
      {filtersVisible && (
        <Form form={form} onValuesChange={handleFormChange} className="notifications__filters_form">
          <Row gutter={16}>
            <Col span={4}>
              <div className="notifications__filter-label">Role</div>
              <Form.Item name="role">
                <Select placeholder="Role" allowClear>
                  {roleOptions.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={5}>
              <div className="notifications__filter-label">Application</div>
              <Form.Item name="application">
                <Select placeholder="Application" allowClear>
                  {applicationOptions.map((a) => (
                    <Option key={a} value={a}>
                      {a}
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
};

export default UserFilters;
