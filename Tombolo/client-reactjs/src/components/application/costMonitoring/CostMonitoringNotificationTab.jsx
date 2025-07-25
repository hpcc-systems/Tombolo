import React from 'react';
import { Card, Form, InputNumber } from 'antd';
import PrimaryContacts from '../../common/Monitoring/PrimaryContacts';

function CostMonitoringNotificationTab({ form }) {
  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Cost Threshold"
          name="threshold"
          rules={[{ required: true, message: 'Please enter a threshold' }]}>
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter threshold value" />
        </Form.Item>
        <PrimaryContacts />
      </Form>
    </Card>
  );
}

export default CostMonitoringNotificationTab;
