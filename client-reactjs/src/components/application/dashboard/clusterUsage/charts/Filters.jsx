import React, { useEffect } from 'react';
import { Form, Select, DatePicker, Button, message } from 'antd';
import moment from 'moment';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

function Filters({ setSelectedCluster, clusterOptions, setHistoryDateRange }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (clusterOptions) {
      form.setFieldsValue({ clusterOptions: clusterOptions[0] });
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
          <Select options={clusterOptions} />
        </Form.Item>

        <Form.Item name="dateRange" style={{ display: 'inline-block' }} rules={[{ required: true }]}>
          <DatePicker.RangePicker disabledDate={disabledDate} allowClear={true} />
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
