import React from 'react';
import { Form, Select, Input } from 'antd';
import { matches } from 'validator';

const { Option } = Select;

function CostMonitoringBasicTab({ form, clusters, handleClusterChange }) {
  return (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Monitoring Name"
        name="monitoringName"
        rules={[{ required: true, message: 'Please enter a monitoring name' }]}>
        <Input placeholder="Enter monitoring name" />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please enter a description' }]}>
        <Input.TextArea placeholder="Enter description" />
      </Form.Item>
      <Form.Item
        label="Clusters"
        name="clusterIds"
        rules={[{ required: true, message: 'Select at least one cluster' }]}>
        <Select mode="multiple" onChange={(value) => handleClusterChange(value)}>
          {clusters.map((cluster) => {
            return (
              <Option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </Option>
            );
          })}
        </Select>
      </Form.Item>
      <Form.Item
        label="Users"
        name="users"
        rules={[
          {
            required: true,
            message: 'Enter at least one user',
            validator: (_, value) => {
              if (!value || value.length === 0) {
                return Promise.reject(new Error('Please add at least one email!'));
              }
              if (!value.every((v) => v === '*' || matches(v, '^[a-zA-Z0-9._-]+$'))) {
                return Promise.reject(new Error('Please enter only alphanumeric characters or "*"'));
              }

              return Promise.resolve();
            },
          },
        ]}>
        <Select
          mode="tags"
          allowClear
          placeholder="Enter a comma-delimited list of email addresses"
          tokenSeparators={[',']}
        />
      </Form.Item>
    </Form>
  );
}

export default CostMonitoringBasicTab;
