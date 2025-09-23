//Packages
import React, { useEffect, useState } from 'react';
import { Form, Select } from 'antd';

//Local Imports
import NotificationContacts from '../../common/Monitoring/NotificationContacts';

//Constants
const { Option } = Select;

const BASE_JOB_STATUSES = [
  { label: 'Failed', value: 'Failed' },
  { label: 'Aborted', value: 'Aborted' },
  { label: 'Unknown', value: 'Unknown' },
  { label: 'Time Series Analysis', value: 'TimeSeriesAnalysis' },
  { label: 'Job running too long', value: 'JobRunningTooLong' },
  { label: 'Not started on time', value: 'NotStarted', disabled: true },
  { label: 'Not completed on time', value: 'NotCompleted' },
];

function JobMonitoringNotificationTab({ form, intermittentScheduling }) {
  const [jobStatuses, setJobStatuses] = useState([]);

  // When the component loads
  useEffect(() => {
    if (intermittentScheduling.frequency !== 'anytime') {
      setJobStatuses(BASE_JOB_STATUSES);
    } else {
      const filteredJobStatuses = BASE_JOB_STATUSES.filter(
        (status) => status.value !== 'NotStarted' && status.value !== 'NotCompleted'
      );
      setJobStatuses(filteredJobStatuses);
    }
  }, [intermittentScheduling]);

  // JSX
  return (
    <Form form={form} layout="vertical">
      <NotificationContacts>
        <Form.Item
          name="notificationCondition"
          label="Notify when"
          rules={[{ required: true, message: 'Select one or more options' }]}>
          <Select mode="multiple" placeholder="Select one">
            {jobStatuses.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </NotificationContacts>
    </Form>
  );
}

export default JobMonitoringNotificationTab;
