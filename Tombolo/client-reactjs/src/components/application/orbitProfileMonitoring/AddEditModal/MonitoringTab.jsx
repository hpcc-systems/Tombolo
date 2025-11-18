import React from 'react';
import { Form, Card, Select, Input } from 'antd';

const { Option } = Select;

function MonitoringTab({ form, clusters, setSelectedCluster, _isEditing, _selectedMonitoring }) {
  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Cluster"
          name="clusterId"
          rules={[{ required: true, message: 'Please select a cluster' }]}>
          <Select
            placeholder="Select a cluster"
            allowClear
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              const cluster = clusters?.find((c) => c.id === value);
              setSelectedCluster(cluster);
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
          <Input
            placeholder="Enter build name"
          />
        </Form.Item>
 
        
      </Form>
    </Card>
  );
}

export default MonitoringTab;