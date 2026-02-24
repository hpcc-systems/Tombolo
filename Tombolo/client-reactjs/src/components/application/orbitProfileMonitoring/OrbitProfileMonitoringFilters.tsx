import React from 'react';
import { Row, Col, Input, Button, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

function OrbitProfileMonitoringFilters(props: any) {
  const { onSearch, onClear, applications = [], filters = {} } = props;

  const handleSearch = () => {
    if (onSearch) onSearch();
  };

  const handleClear = () => {
    if (onClear) onClear();
  };

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Input placeholder="Search by name" prefix={<SearchOutlined />} defaultValue={filters.name} onPressEnter={handleSearch} />
      </Col>
      <Col span={6}>
        <Select placeholder="Application" allowClear defaultValue={filters.applicationId} style={{ width: '100%' }}>
          {applications.map((app: any) => (
            <Option value={app.id} key={app.id}>{app.name}</Option>
          ))}
        </Select>
      </Col>
      <Col span={6}>
        <Button type="primary" onClick={handleSearch}>Search</Button>
        <Button style={{ marginLeft: 8 }} onClick={handleClear}>Clear</Button>
      </Col>
    </Row>
  );
}

export default OrbitProfileMonitoringFilters;
