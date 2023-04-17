import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Checkbox } from 'antd';
import cronstrue from 'cronstrue';

function MonitoringTab({ jobMonitorings, selectedMonitoring }) {
  const [cornExpaliner, setCornExplainer] = useState(null);
  const [cron, setCorn] = useState(null);

  useEffect(() => {
    if (cron) {
      try {
        const explainer = cronstrue.toString(cron);
        setCornExplainer({ valid: true, message: `Runs ${explainer.toLocaleLowerCase()}` });
      } catch (err) {
        setCornExplainer(null);
      }
    }
    if (!cron) setCornExplainer(null);
  }, [cron]);

  return (
    <>
      <Form.Item
        label="Monitoring name"
        name="name"
        required
        rules={[
          {
            validator: (_, value) => {
              const nameExists = jobMonitorings.find((monitoring) => monitoring.name === value);
              if (!value) {
                return Promise.reject('Invalid name');
              } else if (!selectedMonitoring && nameExists) {
                return Promise.reject('File Monitoring with same name already exists');
              } else {
                return Promise.resolve();
              }
            },
          },
        ]}>
        <Input></Input>
      </Form.Item>

      <Form.Item
        label="Cron (How often to monitor)"
        name="cron"
        rules={[
          { required: true, message: 'Required field' },
          {
            validator: async (_, cron) => {
              if (cron) {
                try {
                  const cronInArray = cron.split(' ');
                  if (cronInArray.length > 5) {
                    setCornExplainer({ valid: true, message: `` });
                    return Promise.reject('Cron expression has more than 5 parts');
                  } else {
                    cronstrue.toString(cron);
                  }
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

      <Form.Item name="isActive" valuePropName="checked" noStyle>
        <Checkbox>Start monitoring now</Checkbox>
      </Form.Item>
    </>
  );
}

export default MonitoringTab;
