import React from 'react';
import { Form, InputNumber } from 'antd';
import NotificationContacts from '../../common/Monitoring/NotificationContacts';

function CostMonitoringNotificationTab({ form }) {
  return (
    <NotificationContacts form={form}>
      <Form.Item
        label="Cost Threshold"
        name="threshold"
        rules={[{ required: true, message: 'Please enter a threshold' }]}>
        <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter threshold value" />
      </Form.Item>
    </NotificationContacts>
  );
}

export default CostMonitoringNotificationTab;
