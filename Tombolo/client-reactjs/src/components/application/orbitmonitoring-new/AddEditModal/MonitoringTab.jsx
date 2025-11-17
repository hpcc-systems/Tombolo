import React from 'react';
import { Form, Card, Select } from 'antd';

const { Option } = Select;

// Mock build names for demonstration
const mockBuilds = [
  { label: 'Current Carrier Build', value: 'current_carrier' },
  { label: 'TN DMV Build', value: 'tn_dmv' },
  { label: 'Market Magnifier Build', value: 'market_magnifier' },
  { label: 'Insurance Analytics Build', value: 'insurance_analytics' },
  { label: 'Risk Assessment Build', value: 'risk_assessment' },
];

// Notification condition options
const notificationConditions = [
  { value: 'FAILED_QA', label: 'Failed QA' },
  { value: 'BUILD_FAILED', label: 'Build Failed' },
  { value: 'ABORTED', label: 'Aborted' },
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function MonitoringTab({ form, clusters, selectedCluster, setSelectedCluster, _isEditing, _selectedMonitoring }) {
  const handleBuildSearch = (searchText) => {
    console.log('Searching for builds:', searchText);
    // In real implementation, this would trigger API call to search builds
  };

  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Cluster"
          name="cluster"
          rules={[{ required: true, message: 'Please select a cluster' }]}>
          <Select
            placeholder="Select a cluster"
            allowClear
            showSearch
            optionFilterProp="children"
            value={selectedCluster?.id || undefined}
            onChange={(value) => {
              const cluster = clusters?.find((c) => c.id === value);
              setSelectedCluster(cluster);
              console.log('Selected cluster:', cluster);
            }}>
            {clusters?.map((cluster) => (
              <Option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Build Name"
          name="buildName"
          rules={[{ required: true, message: 'Please select or enter a build name' }]}>
          <Select
            showSearch
            placeholder="Search and select build name"
            optionFilterProp="children"
            onSearch={handleBuildSearch}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }>
            {mockBuilds.map((build, index) => (
              <Option key={index} value={build.value}>
                {build.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Notification Conditions"
          name="notificationConditions"
          rules={[{ required: true, message: 'Please select at least one notification condition' }]}>
          <Select
            mode="multiple"
            placeholder="Select notification conditions"
            optionLabelProp="label">
            {notificationConditions.map((condition) => (
              <Option key={condition.value} value={condition.value} label={condition.label}>
                {condition.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default MonitoringTab;