import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Checkbox, Select, DatePicker } from 'antd';
import cronstrue from 'cronstrue';

const MonitoringTab = ({
  monitoringDetails,
  setMonitoringDetails,
  selectedFileMonitoringDetails,
  setDisplayName,
  entryForm,
  cron,
  setCron,
  superfileMonitoringList,
  selectedFileMonitoring,
  disabled,
}) => {
  const [cronExplainer, setCronExplainer] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);
  const [minExpectedFileSize, setMinExpectedFileSize] = useState(null);
  const [maxExpectedFileSize, setMaxExpectedFileSize] = useState(null);
  const [minNumberOfSubFiles, setMinNumberOfSubFles] = useState(null);
  const [maxNumberOfSubFiles, setMaxNumberOfSubFles] = useState(null);
  const [updateIntervalDays, setUpdateIntervalDays] = useState(null);
  const [updateIntervalInitialDate, setUpdateIntervalInitialDate] = useState(null);

  useEffect(() => {}, [selectedFileMonitoringDetails]);

  const notificationConditions = [
    { label: 'File size Changes', value: 'fileSizeChanged' },
    { label: 'Total size not in range', value: 'fileSizeRange' },
    { label: 'Subfile count Changes', value: 'subFileCountChange' },
    { label: 'Subfile count not in range', value: 'subFileCountRange' },
    { label: 'Update Interval not followed', value: 'updateInterval' },
    { label: 'File Deleted', value: 'deleted' },
  ];

  const daysOfTheWeek = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' },
  ];

  useEffect(() => {
    if (cron) {
      try {
        const explainer = cronstrue.toString(cron);
        entryForm.setFields([
          {
            name: 'cron',
            errors: null,
          },
        ]);
        setCronExplainer({ valid: true, message: `Runs ${explainer.toLocaleLowerCase()}` });
      } catch (err) {
        setCronExplainer(null);
        entryForm.setFields([
          {
            name: 'cron',
            errors: [err.split(':')[1]],
          },
        ]);
      }
    }
    if (!cron) setCronExplainer(null);
  }, [cron]);

  // Set expected file size
  const onExpectedFileSizeChange = (limit, size) => {
    if (limit === 'min') {
      setMinExpectedFileSize(size);
    } else {
      setMaxExpectedFileSize(size);
    }
  };

  // Set expected subfile count change
  const onExpectedSubFileCountChange = (limit, size) => {
    if (limit === 'min') {
      setMinNumberOfSubFles(size);
    } else {
      setMaxNumberOfSubFles(size);
    }
  };

  return (
    <>
      <Form.Item
        label="Display Name"
        name="monitorName"
        style={{ width: 'calc(47.5% - 8px)' }}
        onChange={(value) => {
          setDisplayName(value);
        }}
        disabled={disabled}
        rules={[
          { required: true, message: 'Required filed' },
          {
            message: 'Monitoring with same name already exists',
            validator: (_, value) => {
              //only validate if not viewing other file details
              if (!selectedFileMonitoring) {
                const nameExists = superfileMonitoringList.find((Monitoring) => Monitoring.name === value);

                // if (nameExists || selectedFileMonitoringDetails) {
                if (!nameExists) {
                  return Promise.resolve();
                } else {
                  return Promise.reject();
                }
              } else {
                return Promise.resolve();
              }
            },
          },
        ]}>
        <Input placeholder="Display Name" disabled={disabled}></Input>
      </Form.Item>
      <Form.Item
        label="Cron (How often to monitor)"
        style={{ width: 'calc(47.5% - 8px)' }}
        onChange={(e) => setMonitoringDetails({ ...monitoringDetails, cron: e.target.value })}
        name="cron"
        rules={[
          { required: true, message: 'Required field' },
          {
            validator: async (_, cron) => {
              if (cron) {
                try {
                  cronstrue.toString(cron);
                } catch (err) {
                  return Promise.reject(err);
                }
              }
            },
          },
        ]}
        extra={
          cronExplainer ? (
            <span style={{ color: '#1890ff' }}>{cronExplainer.message}</span>
          ) : (
            <Typography.Link href="https://crontab.cronhub.io/" target="_blank">
              Click here to create cron expression
            </Typography.Link>
          )
        }>
        <Input
          placeholder="*/5 * * * *"
          onChange={(e) => {
            setCron(e.target.value);
          }}
        />
      </Form.Item>

      <Form.Item
        label="Notify when"
        style={{ width: '50%' }}
        name="notifyCondition"
        rules={[{ required: true, message: 'Required filed' }]}>
        <Select
          placeholder="Select one or more"
          mode="multiple"
          options={notificationConditions}
          onChange={(value) =>
            setMonitoringDetails({
              ...monitoringDetails,
              monitoringConditions: value,
            })
          }></Select>
      </Form.Item>

      {monitoringDetails.monitoringConditions.includes('subFileCountRange') ? (
        <Form.Item label="Expected Number of Subfiles" style={{ marginBottom: 0 }} required>
          <Form.Item
            style={{ display: 'inline-block', width: 'calc(25% - 12px)', textAlign: 'center' }}
            name="minimumSubFileCount">
            <Input
              placeholder="Min number of files"
              value={minNumberOfSubFiles} // TODO- if file size none - will throw error because input type is size
              type="number"
              onChange={(e) => {
                onExpectedSubFileCountChange('min', e.target.value);
              }}
            />
          </Form.Item>

          <span style={{ display: 'inline-block', width: '24px', lineHeight: '32px', textAlign: 'center' }}>-</span>
          <Form.Item
            style={{ display: 'inline-block', width: 'calc(25% - 12px)', textAlign: 'center' }}
            name="maximumSubFileCount">
            <Input
              placeholder="Max number of files"
              value={maxNumberOfSubFiles}
              type="number"
              onChange={(e) => {
                onExpectedSubFileCountChange('max', e.target.value);
              }}
            />
          </Form.Item>
        </Form.Item>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('fileSizeRange') ? (
        <Form.Item label="Expected File Size (in KB)" style={{ marginBottom: 0 }} required>
          <Form.Item style={{ display: 'inline-block', width: 'calc(25% - 12px)' }} name="minimumFileSize">
            <Input
              placeholder="Min size"
              value={minExpectedFileSize} // TODO- if file size none - will throw error because input type is size
              type="number"
              suffix="KB"
              onChange={(e) => {
                onExpectedFileSizeChange('min', e.target.value);
              }}
            />
          </Form.Item>

          <span style={{ display: 'inline-block', width: '24px', lineHeight: '32px', textAlign: 'center' }}>-</span>
          <Form.Item style={{ display: 'inline-block', width: 'calc(25% - 12px)' }} name="maximumFileSize">
            <Input
              placeholder="Max size"
              value={maxExpectedFileSize}
              type="number"
              suffix="KB"
              onChange={(e) => {
                onExpectedFileSizeChange('max', e.target.value);
              }}
            />
          </Form.Item>
        </Form.Item>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('updateInterval') && !selectedFileMonitoring ? (
        <>
          <Form.Item name="updateInterval" required label="How often is the superfile expected to be updated?">
            <Input
              type="number"
              suffix="Days Between Updates"
              placeholder={0}
              style={{ display: 'flex', width: 'calc(50% - 12px)', textAlign: 'center' }}
              value={updateInterval}
              onChange={(e) => {
                setUpdateInterval(e.target.value);
              }}></Input>
          </Form.Item>

          <Form.Item
            name="updateIntervalInitialDate"
            label="When was the last date the superfile was supposed to be modified?"
            rules={[{ required: true, message: 'Please Select a date' }]}>
            <DatePicker
              value={updateIntervalInitialDate}
              onChange={(value) => setUpdateIntervalInitialDate(value)}></DatePicker>
          </Form.Item>

          <Form.Item
            name="updateIntervalDays"
            label="What Days of the week is the superfile expected to be updated on?">
            <Select
              placeholder="Select one or more"
              mode="multiple"
              options={daysOfTheWeek}
              value={updateIntervalDays}
              onChange={(value) => setUpdateIntervalDays({ value })}></Select>
          </Form.Item>
        </>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('updateInterval') && selectedFileMonitoring ? (
        <>
          <Form.Item name="updateInterval" required label="How often is the superfile expected to be updated?">
            <Input
              type="number"
              suffix="Days Between Updates"
              placeholder={0}
              style={{ display: 'flex', width: 'calc(50% - 12px)', textAlign: 'center' }}
              value={updateInterval}
              onChange={(e) => {
                setUpdateInterval(e.target.value);
              }}></Input>
          </Form.Item>

          <Form.Item
            name="updateIntervalDays"
            label="What Days of the week is the superfile expected to be updated on?">
            <Select
              placeholder="Select one or more"
              mode="multiple"
              options={daysOfTheWeek}
              value={updateIntervalDays}
              onChange={(value) => setUpdateIntervalDays({ value })}></Select>
          </Form.Item>
        </>
      ) : null}

      <Form.Item name="monitoringActive" valuePropName="checked" noStyle>
        <Checkbox>Start monitoring now</Checkbox>
      </Form.Item>
    </>
  );
};

export default MonitoringTab;
