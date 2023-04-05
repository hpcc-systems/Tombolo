import React from 'react';
import { Form, Select, DatePicker, Button, message } from 'antd';
import moment from 'moment';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import '../index.css';

const monitoringTypeOptions = [
  { label: 'Job', value: 'job' },
  { label: 'File', value: 'file' },
  { label: 'Cluster', value: 'cluster' },
  { label: 'Super File', value: 'superFile' },
];

const monitoringStatusOptions = [
  { label: 'Notified', value: 'notified' },
  { label: 'Triage', value: 'triage' },
  { label: 'In-Progress', value: 'inProgress' },
  { label: 'Completed', value: 'completed' },
];

const groupByOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

function Filters({ applicationId, setNotifications, setLoadingData, groupDataBy, setGroupDataBy }) {
  const [form] = Form.useForm();

  // When from is submitted
  const onFinish = (formValues) => {
    try {
      form.validateFields();
      filterAndFetchNotifications(formValues);
    } catch (err) {
      handleError(err);
    }
  };

  //Get list of file monitorings that matches a filter
  const filterAndFetchNotifications = async (filters) => {
    try {
      setLoadingData(true);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const queryData = JSON.stringify({ ...filters, applicationId });

      const response = await fetch(`/api/notifications/read/filteredNotifications?queryData=${queryData}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      message.error('Failed to fetch notifications');
    } finally {
      setLoadingData(false);
    }
  };

  // Disable future dates
  const disabledDate = (current) => {
    const date = new Date();
    const todaysDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return current && current >= todaysDate;
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Form
        {...layout}
        onFinish={onFinish}
        className="filters__form"
        form={form}
        initialValues={{
          ['monitoringType']: ['job', 'file', 'cluster', 'superFile'],
          ['monitoringStatus']: ['notified', 'triage', 'inProgress', 'completed'],
          ['dateRange']: [moment().subtract(15, 'days'), moment()],
          groupDataBy: groupDataBy,
        }}>
        <Form.Item label="Monitoring type" name="monitoringType" style={{ display: 'inline-block' }}>
          <Select options={monitoringTypeOptions} mode="multiple" />
        </Form.Item>

        <Form.Item label="Notification status" name="monitoringStatus" style={{ display: 'inline-block' }}>
          <Select options={monitoringStatusOptions} mode="multiple" />
        </Form.Item>

        <Form.Item label="Date range" name="dateRange" style={{ display: 'inline-block' }}>
          <DatePicker.RangePicker
            disabledDate={disabledDate}
            allowClear={true}
            onChange={(value) => {
              const numberOfDays = Math.ceil(Math.abs(value[0] - value[1]) / (1000 * 60 * 60 * 24) + 1);

              let suggestedFilterByOption;

              if (numberOfDays <= 15) {
                setGroupDataBy('day');
                suggestedFilterByOption = 'day';
              } else if (numberOfDays > 15 && numberOfDays <= 105) {
                setGroupDataBy('week');
                suggestedFilterByOption = 'week';
              } else if (numberOfDays > 105 && numberOfDays <= 548) {
                setGroupDataBy('month');
                suggestedFilterByOption = 'month';
              } else {
                suggestedFilterByOption = 'year';
                setGroupDataBy('year');
              }

              form.setFieldsValue({ groupDataBy: suggestedFilterByOption });
            }}
          />
        </Form.Item>

        <Form.Item name={'groupDataBy'} label="Group By" style={{ display: 'inline-block' }}>
          <Select
            options={groupByOptions}
            value={groupDataBy}
            onSelect={(value) => {
              setGroupDataBy(value);
            }}></Select>
        </Form.Item>

        <Form.Item className="hide_formItem_label" label="button" style={{ display: 'inline-block' }}>
          <Button type="primary" htmlType="submit">
            Go
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Filters;

// TODO - Monitorings status and monitoring type must from the below set
// STATUS -> notified , triage, inProgress, completed
// MONITORING TYPE -> 'jobMonitoring', 'file','cluster','superFile' }

//2.  Make sure all the columns in notification tables are populated
//3. Clear date picker is not working. When no date range is selected, it should set the group by option to 'Year'
//4. Make responsive - Add media queries - Done
//5. Metric Tiles fix Heading case - Done
//6. Sort Data by date before sending to the client - Done
// 7. Check backend validation
