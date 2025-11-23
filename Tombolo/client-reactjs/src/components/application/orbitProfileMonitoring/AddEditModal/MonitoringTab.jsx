import React from 'react';
import { Form, Card, Select, Input } from 'antd';

const { Option } = Select;

function MonitoringTab({ form, _isEditing, _selectedMonitoring }) {
  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Build Name"
          name="buildName"
          rules={[{ required: true, message: 'Please select or enter a build name' }]}>
          <Input placeholder="Enter build name" />
        </Form.Item>
      </Form>
    </Card>
  );
}

export default MonitoringTab;
