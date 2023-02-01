import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Select, Checkbox } from 'antd';
import cronstrue from 'cronstrue';

// Notify conditions / options
const notificationConditionForLandingZoneFiles = [
  { label: 'File is not moving', value: 'fileNotMoving' },
  { label: 'File is detected', value: 'fileDetected' },
  { label: 'Incorrect file size', value: 'incorrectFileSize' },
];

const notificationConditionForLogicalFiles = [
  { label: 'File size', value: 'fileSizeChanged' },
  { label: 'File size not in range', value: 'incorrectFileSize' },
  { label: 'Owner', value: 'owner' },
  { label: 'File Type', value: 'fileType' },
  { label: 'Compressed', value: 'compressed' },
  { label: 'Protected', value: 'protected' },
  { label: 'File Deleted', value: 'deleted' },
];

function MonitoringTab({
  monitoringDetails,
  monitoringDetails: { monitoringConditions },
  setMonitoringDetails,
  monitoringTabForm,
  fileMonitoringList,
  monitoringAssetType,
  selectedFileMonitoringDetails,
}) {
  const [cron, setCorn] = useState(null);
  const [cornExpaliner, setCornExplainer] = useState(null);
  const [minExpectedFileSize, setMinExpectedFileSize] = useState(null);
  const [maxExpectedFileSize, setMaxExpectedFileSize] = useState(null);

  // Populate the monitoring details if viewing existing monitoring ---------------------------------
  useEffect(() => {
    if (selectedFileMonitoringDetails === null) return;
    const {
      name,
      cron,
      metaData: {
        monitoringCondition: { notifyCondition, maximumFileSize, minimumFileSize, expectedFileMoveTime },
      },
    } = selectedFileMonitoringDetails;

    monitoringTabForm.setFieldsValue({ name, cron, notifyCondition });
    setMonitoringDetails({
      ...monitoringDetails,
      monitoringConditions: notifyCondition,
    });
    if (notifyCondition.includes('incorrectFileSize')) {
      monitoringTabForm.setFieldsValue({ maximumFileSize, minimumFileSize });
    }
    if (notifyCondition.includes('fileNotMoving')) {
      monitoringTabForm.setFieldsValue({ expectedFileMoveTime });
    }
  }, [selectedFileMonitoringDetails]);

  useEffect(() => {
    if (cron) {
      try {
        const explainer = cronstrue.toString(cron);
        monitoringTabForm.setFields([
          {
            name: 'cron',
            errors: null,
          },
        ]);
        setCornExplainer({ valid: true, message: `Runs ${explainer.toLocaleLowerCase()}` });
      } catch (err) {
        setCornExplainer(null);
        monitoringTabForm.setFields([
          {
            name: 'cron',
            errors: [err.split(':')[1]],
          },
        ]);
      }
    }
    if (!cron) setCornExplainer(null);
  }, [cron]);

  // Set expected file size
  const onExpectedFileSizeChange = (limit, size) => {
    if (limit === 'min') {
      setMinExpectedFileSize(size);
    } else {
      setMaxExpectedFileSize(size);
    }
  };
  return (
    <Form layout="vertical" form={monitoringTabForm} initialValues={{ monitoringActive: true }}>
      <Form.Item
        label="Monitoring name"
        style={{ width: '50%' }}
        name="name"
        rules={[
          { required: true, message: 'Required filed' },
          {
            message: 'File Monitoring with same name already exists',
            validator: (_, value) => {
              const nameExists = fileMonitoringList.find((fileMonitoring) => fileMonitoring.displayName === value);
              if (!nameExists || selectedFileMonitoringDetails) {
                return Promise.resolve();
              } else {
                return Promise.reject();
              }
            },
          },
        ]}>
        <Input onChange={(e) => setMonitoringDetails({ ...monitoringDetails, name: e.target.value })}></Input>
      </Form.Item>

      <Form.Item
        label="Cron (How often to monitor)"
        style={{ width: '50%' }}
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
          cornExpaliner ? (
            <span style={{ color: '#1890ff' }}>{cornExpaliner.message}</span>
          ) : (
            <Typography.Link href="https://crontab.cronhub.io/" target="_blank">
              Click here to create cron expression
            </Typography.Link>
          )
        }>
        <Input
          placeholder="*/5 * * * *"
          onChange={(e) => {
            setCorn(e.target.value);
          }}
        />
      </Form.Item>

      {monitoringAssetType ? (
        <Form.Item
          label="Notify when"
          style={{ width: '50%' }}
          name="notifyCondition"
          rules={[{ required: true, message: 'Required filed' }]}>
          <Select
            placeholder="Select one or more"
            mode="multiple"
            options={
              monitoringAssetType === 'landingZoneFile'
                ? notificationConditionForLandingZoneFiles
                : notificationConditionForLogicalFiles
            }
            onChange={(value) =>
              setMonitoringDetails({
                ...monitoringDetails,
                monitoringConditions: value,
              })
            }></Select>
        </Form.Item>
      ) : null}

      {monitoringConditions.includes('fileNotMoving') ? (
        <Form.Item
          label="Expected file move time (in mins)"
          name="expectedFileMoveTime"
          style={{ width: '50%' }}
          rules={[{ required: true, message: 'Required Field' }]}>
          <Input type="number"></Input>
        </Form.Item>
      ) : null}

      {monitoringConditions.includes('incorrectFileSize') ? (
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

      <Form.Item name="monitoringActive" valuePropName="checked" noStyle>
        <Checkbox>Start monitoring now</Checkbox>
      </Form.Item>
    </Form>
  );
}

export default MonitoringTab;
