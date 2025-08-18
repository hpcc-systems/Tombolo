import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Select } from 'antd';
import NotificationContacts from '../../common/Monitoring/NotificationContacts';
const { Option } = Select;

const IsSummedDropdown = ({ form }) => {
  const [scope, setScope] = useState('');

  useEffect(() => {
    if (form) {
      setScope(form.getFieldValue('monitoringScope'));
    }
  }, [form, form.getFieldValue('monitoringScope')]);

  if (scope === 'users') {
    return (
      <Form.Item noStyle={true} name="isSummed">
        <Select defaultValue="false">
          <Option value="false">Per user</Option>
          <Option value="true">Total</Option>
        </Select>
      </Form.Item>
    );
  } else if (scope === 'clusters') {
    return (
      <Form.Item noStyle={true} name="isSummed">
        <Select defaultValue="false">
          <Option value="false">Per cluster</Option>
          <Option value="true">Total</Option>
        </Select>
      </Form.Item>
    );
  } else {
    return undefined;
  }
};

function CostMonitoringNotificationTab({ form }) {
  return (
    <NotificationContacts form={form}>
      <Form.Item
        label="Cost Threshold"
        name="threshold"
        rules={[{ required: true, message: 'Please enter a threshold' }]}>
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          placeholder="Enter threshold value"
          addonAfter={<IsSummedDropdown form={form} />}
        />
      </Form.Item>
    </NotificationContacts>
  );
}

export default CostMonitoringNotificationTab;
