import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Button, message } from 'antd';
import { useHistory, useLocation } from 'react-router-dom';
import moment from 'moment';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { monitoringStatusOptions } from '../common/monitoringStatusOptions.js';
import '../common/css/index.css';

// Group by options
const groupByOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

// Form layout
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

function Filters({ applicationId, setBuilds, setLoadingData, groupDataBy, setGroupDataBy, setDefaultFilters }) {
  const [form] = Form.useForm();
  const [dashboardFilters, setDashboardFilters] = useState({});
  const initialValues = {
    status: ['DATA_QA_APPROVED', 'DATA_QA_REJECT', 'ON_HOLD'],
    dateRange: [moment().subtract(15, 'days'), moment()],
    EnvironmentName: ['Insurance'],
    groupDataBy: groupDataBy,
  };
  const history = useHistory();
  const location = useLocation();

  // When form is submitted
  const onFinish = (formValues) => {
    try {
      form.validateFields();
      filterAndFetchbuilds(formValues);
    } catch (err) {
      handleError(err);
    }
  };

  //Get list of file monitorings that matches a filter
  const filterAndFetchbuilds = async (filters) => {
    try {
      setLoadingData(true);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const queryData = JSON.stringify({ ...filters, applicationId });

      const response = await fetch(`/api/orbit/filteredbuilds?queryData=${queryData}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setBuilds(data);
    } catch (error) {
      message.error('Failed to fetch builds');
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

  // When filters are changed - add to url params to persist on page refresh
  const updateParams = (param) => {
    const newParams = new URLSearchParams();
    const allFilters = { ...dashboardFilters, ...param };

    for (let key in allFilters) {
      newParams.set(key, allFilters[key]);
    }
    history.push(`?${newParams.toString()}`);
  };

  // When page loads, check url params, if present - apply them as filter to fetch build
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filters = {};
    if (params.get('monitoringType')) {
      filters.monitoringType = params.get('monitoringType')?.split(',');
    }
    if (params.get('monitoringStatus')) {
      filters.monitoringStatus = params.get('monitoringStatus')?.split(',');
    }
    if (params.get('dateRange')) {
      const dateString = params.get('dateRange');
      const dates = dateString.split(',');
      const range = [moment(dates[0]), moment(dates[1])];
      filters.dateRange = range;
    }

    if (params.get('groupDataBy')) {
      filters.groupDataBy = params.get('groupDataBy');
      setGroupDataBy(params.get('groupDataBy'));
    }

    if (Object.keys(filters).length > 0) {
      setDashboardFilters(filters);
      form.setFieldsValue(filters);
      setDefaultFilters((prev) => ({ ...prev, ...filters }));
    }
  }, []);

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Form {...layout} onFinish={onFinish} className="filters__form" form={form} initialValues={initialValues}>
        <Form.Item label="build status" name="status" style={{ display: 'inline-block' }}>
          <Select
            options={monitoringStatusOptions}
            mode="multiple"
            onChange={(values) => {
              setDashboardFilters((prev) => ({ ...prev, monitoringStatus: values }));
              updateParams({ monitoringStatus: values });
            }}
          />
        </Form.Item>

        <Form.Item label="Date range" name="dateRange" style={{ display: 'inline-block' }}>
          <DatePicker.RangePicker
            disabledDate={disabledDate}
            allowClear={true}
            onChange={(value) => {
              setDashboardFilters((prev) => ({ ...prev, dateRange: value }));
              updateParams({ dateRange: value });

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
              setDashboardFilters((prev) => ({ ...prev, dateRange: value }));
              updateParams({ groupDataBy: value });
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
