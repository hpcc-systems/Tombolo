import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Checkbox, Select } from 'antd';
import cronstrue from 'cronstrue';
import InfoDrawer from '../../common/InfoDrawer';
import { InfoCircleOutlined } from '@ant-design/icons';

const MonitoringTab = ({
  entryForm,
  cron,
  setCron,
  monitoringDetails,
  setMonitoringDetails,
  orbitBuildList,
  editing,
}) => {
  const [cronExplainer, setCronExplainer] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);
  const [updateIntervalDays, setUpdateIntervalDays] = useState(null);
  const [buildStatus, setBuildStatus] = useState(null);

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {}, []);

  const notificationConditions = [
    { label: 'Build Status', value: 'buildStatus' },
    { label: 'Build Interval', value: 'updateInterval' },
    { label: 'Deleted', value: 'deleted' },
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

  const buildStatuses = [
    { label: 'BUILD_AVAILABLE_FOR_USE', value: 'build_available_for_use' },
    { label: 'DISCARDED', value: 'discarded' },
    { label: 'FAILED_QA_QAHELD', value: 'failed_qa_qaheld' },
    { label: 'GRAVEYARD', value: 'graveyard' },
    { label: 'PASSED_QA', value: 'passed_qa' },
    { label: 'PASSED_QA_NO_RELEASE', value: 'passed_qa_no_release' },
    { label: 'PRODUCTION', value: 'production' },
    { label: 'SKIPPED', value: 'skipped' },
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

  return (
    <>
      <Form.Item
        label="Display Name"
        name="name"
        validateTrigger={['onChange', 'onBlur']}
        style={{ width: 'calc(47.5% - 8px)' }}
        rules={[
          { required: true, message: 'Required filed' },
          {
            max: 256,
            message: 'Maximum of 256 characters allowed',
          },
          {
            message: 'Monitoring with same name already exists',
            validator: (_, value) => {
              // only validate if not viewing other file details
              if (editing) {
                return Promise.resolve();
              } else {
                const nameExists = orbitBuildList.find((Monitoring) => Monitoring.name === value);

                // if (nameExists || selectedOrbitBuildMonitoringDetails) {
                if (!nameExists) {
                  return Promise.resolve();
                } else {
                  return Promise.reject();
                }
              }
            },
          },
        ]}>
        <Input placeholder="Display Name"></Input>
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
        style={{ width: 'calc(47.5% - 8px)' }}
        name="notifyCondition"
        rules={[{ required: true, message: 'Required field' }]}>
        <Select
          placeholder="Select one or more"
          mode="multiple"
          options={notificationConditions}
          onChange={(value) => {
            setMonitoringDetails({
              ...monitoringDetails,
              monitoringConditions: value,
            });
          }}></Select>
      </Form.Item>

      {monitoringDetails.monitoringConditions.includes('buildStatus') ? (
        <>
          <Form.Item name="buildStatus" required label="Status">
            <Select
              placeholder="Select one or more"
              mode="multiple"
              options={buildStatuses}
              value={buildStatus}
              rules={[{ required: true, message: 'Required field' }]}
              onChange={(value) => setBuildStatus({ value })}></Select>
          </Form.Item>
        </>
      ) : null}

      {monitoringDetails.monitoringConditions.includes('updateInterval') && !editing ? (
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

      {monitoringDetails.monitoringConditions.includes('updateInterval') && editing ? (
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

      <Form.Item name="isActive" valuePropName="checked" noStyle>
        <Checkbox>Start monitoring now</Checkbox>
      </Form.Item>
    </>
  );
};

export default MonitoringTab;
