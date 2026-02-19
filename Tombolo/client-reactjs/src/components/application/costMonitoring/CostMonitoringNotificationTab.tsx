import React, { useEffect, useState } from 'react';
import { Form, InputNumber, Select, FormInstance } from 'antd';
import NotificationContacts from '../../common/Monitoring/NotificationContacts';
import currencyCodeToSymbol from '@/components/common/currencyCodeToSymbol';

interface Cluster {
  id: string;
  name: string;
  currencyCode?: string;
}

interface IsSummedDropdownProps {
  form: FormInstance;
}

const IsSummedDropdown = ({ form }: IsSummedDropdownProps) => {
  const [scope, setScope] = useState('');

  useEffect(() => {
    if (form) {
      setScope(form.getFieldValue('monitoringScope'));
    }
  }, [form, form.getFieldValue('monitoringScope')]);

  if (scope === 'users') {
    return (
      <Form.Item noStyle={true} name="isSummed" initialValue={false}>
        <Select
          popupMatchSelectWidth={false}
          dropdownStyle={{ minWidth: 'max-content' }}
          getPopupContainer={() => document.body}
          style={{ minWidth: 120 }}>
          <Select.Option value={false}>Per user</Select.Option>
          <Select.Option value={true}>Total</Select.Option>
        </Select>
      </Form.Item>
    );
  } else if (scope === 'clusters') {
    return (
      <Form.Item noStyle={true} name="isSummed" initialValue={false}>
        <Select
          popupMatchSelectWidth={false}
          dropdownStyle={{ minWidth: 'max-content' }}
          getPopupContainer={() => document.body}
          style={{ minWidth: 120 }}>
          <Select.Option value={false}>Per cluster</Select.Option>
          <Select.Option value={true}>Total</Select.Option>
        </Select>
      </Form.Item>
    );
  } else {
    return undefined;
  }
};

interface CostMonitoringNotificationTabProps {
  form: FormInstance;
  clusters: Cluster[];
}

function CostMonitoringNotificationTab({ form, clusters }: CostMonitoringNotificationTabProps) {
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    if (!form) return;

    const clusterIds = form.getFieldValue('clusterIds');
    if (!clusterIds) return;
    const selectedClusters = clusters.filter(cluster => clusterIds.includes(cluster.id));
    if (selectedClusters.length === 0) return;

    const currencyCode = selectedClusters[0].currencyCode;
    const symbol = currencyCodeToSymbol(currencyCode);
    if (symbol) {
      setCurrencySymbol(symbol);
    }
  }, [form, form.getFieldValue('clusterIds'), clusters]);

  return (
    <Form form={form} layout="vertical">
      <NotificationContacts>
        <Form.Item
          label="Cost Threshold"
          name="threshold"
          rules={[{ required: true, message: 'Please enter a threshold' }]}>
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="Enter threshold value"
            addonBefore={currencySymbol}
            addonAfter={<IsSummedDropdown form={form} />}
          />
        </Form.Item>
      </NotificationContacts>
    </Form>
  );
}

export default CostMonitoringNotificationTab;
