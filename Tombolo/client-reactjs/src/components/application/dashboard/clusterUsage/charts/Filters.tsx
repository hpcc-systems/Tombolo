import React, { useEffect } from 'react';
import { Form, Select, DatePicker, Button } from 'antd';
import { addQueriesToUrl } from '../../../../common/AddQueryToUrl';
import { handleError } from '@/components/common/handleResponse';

const layout = { labelCol: { span: 24 }, wrapperCol: { span: 24 } };

interface Props {
  setSelectedCluster: (v: any) => void;
  selectedCluster: any;
  setHistoryDateRange: (v: any) => void;
  historyDateRange: any[];
  clusterOptions: any[];
}

const Filters: React.FC<Props> = ({
  setSelectedCluster,
  selectedCluster,
  setHistoryDateRange,
  historyDateRange,
  clusterOptions,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (clusterOptions && selectedCluster) form.setFieldsValue({ clusterOptions: selectedCluster });
    if (historyDateRange) form.setFieldsValue({ dateRange: historyDateRange });
  }, [clusterOptions, historyDateRange]);

  const disabledDate = (current: any) => {
    const date = new Date();
    const todaysDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return current && current >= todaysDate;
  };

  const handleFilter = async () => {
    try {
      await form.validateFields();
      const { clusterOptions: selected, dateRange } = form.getFieldsValue();
      setSelectedCluster(selected);
      setHistoryDateRange(dateRange);
    } catch (err) {
      handleError('Failed to fetch data');
    }
  };

  const handleClusterSelection = (value: any) => addQueriesToUrl({ queryName: 'clusterId', queryValue: value });
  const handleDateRangeSelection = (value: any) =>
    addQueriesToUrl({ queryName: 'historyDateRange', queryValue: value });

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Form {...layout} onFinish={handleFilter} className="filters__form" form={form}>
        <Form.Item
          name="clusterOptions"
          style={{ display: 'inline-block', width: '200px' }}
          rules={[{ required: true }]}>
          <Select
            disabled={false}
            options={clusterOptions}
            onChange={value => handleClusterSelection(value)}
            value={selectedCluster}
          />
        </Form.Item>

        <Form.Item name="dateRange" style={{ display: 'inline-block' }} rules={[{ required: true }]}>
          <DatePicker.RangePicker
            disabled={false}
            disabledDate={disabledDate}
            allowClear={true}
            onChange={value => handleDateRangeSelection(value)}
          />
        </Form.Item>

        <Form.Item className="hide_formItem_label" style={{ display: 'inline-block' }}>
          <Button type="primary" htmlType="submit" disabled={false}>
            Go
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Filters;
