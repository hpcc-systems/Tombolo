//Packages
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, Card, Select } from 'antd';

//Local Imports
import AsrSpecificNotificationsDetails from '../../common/Monitoring/AsrSpecificNotificationDetails';
import PrimaryContacts from '../../common/Monitoring/PrimaryContacts';

//Constants
const { Option } = Select;

function JobMonitoringNotificationTab({ form, intermittentScheduling }) {
  // Redux
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);
  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  const BASE_JOB_STATUSES = [
    { label: 'Failed', value: 'Failed' },
    { label: 'Aborted', value: 'Aborted' },
    { label: 'Unknown', value: 'Unknown' },
    { label: 'Time Series Analysis', value: 'TimeSeriesAnalysis' },
    { label: 'Job running too long', value: 'JobRunningTooLong' },
    { label: 'Not started on time', value: 'NotStarted', disabled: true },
    { label: 'Not completed on time', value: 'NotCompleted' },
  ];

  const [jobStatuses, setJobStatuses] = useState([]);

  // When component loads
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
    <Card>
      <Form form={form} layout="vertical">
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
        <PrimaryContacts />
        {asrIntegration && <AsrSpecificNotificationsDetails />}
      </Form>
    </Card>
  );
}

export default JobMonitoringNotificationTab;
