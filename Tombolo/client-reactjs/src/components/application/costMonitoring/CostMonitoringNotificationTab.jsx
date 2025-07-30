import React from 'react';
import { Card, Form, InputNumber } from 'antd';
import PrimaryContacts from '../../common/Monitoring/PrimaryContacts';
import AsrSpecificNotificationsDetails from '../../common/Monitoring/AsrSpecificNotificationDetails';
import { useSelector } from 'react-redux';

function CostMonitoringNotificationTab({ form }) {
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);
  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

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
        {asrIntegration && <AsrSpecificNotificationsDetails />}
      </Form>
    </Card>
  );
}

export default CostMonitoringNotificationTab;
