/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect } from 'react';
import { Form, Select, DatePicker, Button, message } from 'antd';
import moment from 'moment';
import { addQueriesToUrl } from '../../../../common/AddQueryToUrl';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

function Filters({ setSelectedCluster, selectedCluster, setHistoryDateRange, historyDateRange, clusterOptions }) {
  const [form] = Form.useForm();

  // If URL param include clusterId - select it if not select the first one
  useEffect(() => {
    if (clusterOptions && selectedCluster) {
      form.setFieldsValue({ clusterOptions: selectedCluster });
    }
  }, [clusterOptions]);

  // Disable future dates
  const disabledDate = (current) => {
    const date = new Date();
    const todaysDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return current && current >= todaysDate;
  };

  // Onfinish - Go button on filter clicked
  const handleFilter = async () => {
    try {
      await form.validateFields();
      const { clusterOptions, dateRange } = form.getFieldsValue();
      setSelectedCluster(clusterOptions);
      setHistoryDateRange(dateRange);
    } catch (err) {
      message.error('Failed to fetch data');
    }
  };

  // Handle cluster selection
  const handleClusterSelection = (value) => {
    addQueriesToUrl({ queryName: 'clusterId', queryValue: value });
  };

  // Handle date range selection
  const handleDateRangeSelection = (value) => {
    addQueriesToUrl({ queryName: 'dateRange', queryValue: value });
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Form
        {...layout}
        onFinish={handleFilter}
        initialValues={{
          ['dateRange']: [moment().subtract(30, 'days'), moment()],
        }}
        className="filters__form"
        form={form}>
        <Form.Item
          name="clusterOptions"
          style={{ display: 'inline-block', width: '200px' }}
          rules={[{ required: true }]}>
          <Select
            options={clusterOptions}
            onChange={(value) => handleClusterSelection(value)}
            value={selectedCluster}
          />
        </Form.Item>

        <Form.Item name="dateRange" style={{ display: 'inline-block' }} rules={[{ required: true }]}>
          <DatePicker.RangePicker
            disabledDate={disabledDate}
            allowClear={true}
            onChange={(value) => handleDateRangeSelection(value)}
          />
        </Form.Item>

        <Form.Item className="hide_formItem_label" style={{ display: 'inline-block' }}>
          <Button type="primary" htmlType="submit">
            Go
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Filters;
