import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Checkbox, Select, DatePicker } from 'antd';
import cronstrue from 'cronstrue';
import InfoDrawer from '../../common/InfoDrawer';
import { InfoCircleOutlined } from '@ant-design/icons';

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

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

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
        validateTrigger={['onChange', 'onBlur']}
        style={{ width: 'calc(47.5% - 8px)' }}
        onChange={(value) => {
          setDisplayName(value);
        }}
        disabled={disabled}
        rules={[
          { required: true, message: 'Required filed' },
          {
            max: 256,
            message: 'Maximum of 256 characters allowed',
          },
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
        label={
          <>
            <p style={{ marginBottom: '0' }}>
              Cron (How often to monitor)
              <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={() => showDrawer()} />
            </p>
            <InfoDrawer open={open} onClose={onClose} width="700px" content="cron"></InfoDrawer>
          </>
        }
        style={{ width: 'calc(47.5% - 8px)' }}
        onChange={(e) => setMonitoringDetails({ ...monitoringDetails, cron: e.target.value })}
        name="cron"
        rules={[
          { required: true, message: 'Required field' },
          {
            validator: async (_, cron) => {
              if (cron) {
                const cronInArray = cron.split(' ');
                if (cronInArray.length > 5) {
                  setCronExplainer({ valid: false, message: `` });
                  return Promise.reject('Cron expression has more than 5 parts');
                } else {
                  cronstrue.toString(cron);
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
        rules={[{ required: true, message: 'Required field' }]}>
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
        <Form.Item
          label="Expected Number of Subfiles"
          style={{ marginBottom: 0 }}
          rules={[{ required: true, message: 'Required field' }]}>
          <Form.Item
            style={{ display: 'inline-block', width: 'calc(25% - 12px)', textAlign: 'center' }}
            name="minimumSubFileCount"
            rules={[{ required: true, message: 'Required field' }]}>
            <Input
              placeholder="Min"
              value={minNumberOfSubFiles} // TODO- if file size none - will throw error because input type is size
              type="number"
              rules={[{ required: true, message: 'Required field' }]}
              onChange={(e) => {
                onExpectedSubFileCountChange('min', e.target.value);
              }}
            />
          </Form.Item>

          <span style={{ display: 'inline-block', width: '24px', lineHeight: '32px', textAlign: 'center' }}>-</span>
          <Form.Item
            style={{ display: 'inline-block', width: 'calc(25% - 12px)', textAlign: 'center' }}
            name="maximumSubFileCount"
            rules={[{ required: true, message: 'Required field' }]}>
            <Input
              placeholder="Max"
              value={maxNumberOfSubFiles}
              type="number"
              rules={[{ required: true, message: 'Required filed' }]}
              onChange={(e) => {
                onExpectedSubFileCountChange('max', e.target.value);
              }}
            />
          </Form.Item>
        </Form.Item>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('fileSizeRange') ? (
        <Form.Item
          label="Expected File Size (in KB)"
          style={{ marginBottom: 0 }}
          rules={[{ required: true, message: 'Required field' }]}>
          <Form.Item
            required
            style={{ display: 'inline-block', width: 'calc(25% - 12px)' }}
            rules={[{ required: true, message: 'Required field' }]}
            name="minimumFileSize">
            <Input
              placeholder="Min"
              value={minExpectedFileSize} // TODO- if file size none - will throw error because input type is size
              type="number"
              suffix="KB"
              rules={[{ required: true, message: 'Required filed' }]}
              onChange={(e) => {
                onExpectedFileSizeChange('min', e.target.value);
              }}
            />
          </Form.Item>

          <span style={{ display: 'inline-block', width: '24px', lineHeight: '32px', textAlign: 'center' }}>-</span>
          <Form.Item
            required
            style={{ display: 'inline-block', width: 'calc(25% - 12px)' }}
            rules={[{ required: true, message: 'Required field' }]}
            name="maximumFileSize">
            <Input
              placeholder="Max"
              value={maxExpectedFileSize}
              type="number"
              suffix="KB"
              rules={[{ required: true, message: 'Required filed' }]}
              onChange={(e) => {
                onExpectedFileSizeChange('max', e.target.value);
              }}
            />
          </Form.Item>
        </Form.Item>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('updateInterval') && !selectedFileMonitoring ? (
        <>
          <Form.Item name="updateInterval" required label="Days Expected between updates">
            <Input
              type="number"
              placeholder={0}
              suffix="Days Between Updates"
              style={{ display: 'flex', width: 'calc(50% - 12px)', textAlign: 'center' }}
              value={updateInterval}
              rules={[{ required: true, message: 'Required filed' }]}
              onChange={(e) => {
                setUpdateInterval(e.target.value);
              }}></Input>
          </Form.Item>

          <Form.Item
            name="updateIntervalInitialDate"
            label="Last Modified Date"
            rules={[{ required: true, message: 'Please Select a date' }]}>
            <DatePicker
              value={updateIntervalInitialDate}
              onChange={(value) => setUpdateIntervalInitialDate(value)}></DatePicker>
          </Form.Item>

          <Form.Item name="updateIntervalDays" label="Update Days">
            <Select
              placeholder="Select one or more"
              mode="multiple"
              options={daysOfTheWeek}
              value={updateIntervalDays}
              rules={[{ required: true, message: 'Required filed' }]}
              onChange={(value) => setUpdateIntervalDays({ value })}></Select>
          </Form.Item>
        </>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('updateInterval') && selectedFileMonitoring ? (
        <>
          <Form.Item
            name="updateInterval"
            required
            label="Days Expected between updates"
            rules={[{ required: true, message: 'Required field' }]}>
            <Input
              type="number"
              suffix="Days Between Updates"
              placeholder={0}
              style={{ display: 'flex', width: 'calc(50% - 12px)', textAlign: 'center' }}
              value={updateInterval}
              rules={[{ required: true, message: 'Required filed' }]}
              onChange={(e) => {
                setUpdateInterval(e.target.value);
              }}></Input>
          </Form.Item>

          <Form.Item name="updateIntervalDays" label="Update Days">
            <Select
              placeholder="Select one or more"
              mode="multiple"
              options={daysOfTheWeek}
              value={updateIntervalDays}
              style={{ display: 'inline-block', width: 'calc(50% - 12px)', textAlign: 'center' }}
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
