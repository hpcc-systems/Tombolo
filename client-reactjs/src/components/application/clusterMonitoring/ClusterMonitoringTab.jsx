import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Select, Checkbox } from 'antd';
import cronstrue from 'cronstrue';

const notifyOptions = [{ label: 'Exceeded cluster usage %', value: 'TargetClusterAlertSize' }];

function ClusterMonitoringTab({
  clusterMonitorings,
  setNotifyConditions,
  selectedEngines,
  notifyConditions,
  selectedMonitoring,
}) {
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
        validateTrigger={['onChange', 'onBlur']}
        rules={[
          {
            validator: (_, value) => {
              const nameExists = clusterMonitorings.find((monitoring) => monitoring.name === value);
              if (!value) {
                return Promise.reject('Invalid name');
              } else if (!selectedMonitoring && nameExists) {
                return Promise.reject('File Monitoring with same name already exists');
              } else {
                return Promise.resolve();
              }
            },
          },
          {
            max: 256,
            message: 'Maximum of 256 characters allowed',
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

      <Form.Item label="Notify when" name="notifyCondition" rules={[{ required: true, message: 'Required filed' }]}>
        <Select
          placeholder="Select one or more"
          mode="multiple"
          options={notifyOptions}
          onChange={(value) => {
            setNotifyConditions(value);
          }}></Select>
      </Form.Item>

      {selectedEngines.length > 0 && notifyConditions.includes('TargetClusterAlertSize') ? (
        <Form.List name="engineSizeLimit">
          {() => {
            const engineLimits = selectedEngines.map((engine) => {
              return (
                <Form.Item
                  name={`engineLimit-${engine}`}
                  key={engine}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.reject('Invalid size');
                        }
                        const splittedVal = value.split('');
                        const isLastItemNum = !isNaN(parseInt(splittedVal[splittedVal.length - 1]));

                        if (isLastItemNum) {
                          return Promise.resolve();
                        } else {
                          return Promise.reject('Invalid size');
                        }
                      },
                    },
                  ]}>
                  <Input
                    className="clusterMonitoring_engines"
                    addonBefore={engine}
                    placeholder={'Limit in %'}
                    style={{ width: '50%' }}
                    type="number"
                    min={1}
                    max={100}
                  />
                </Form.Item>
              );
            });
            return engineLimits;
          }}
        </Form.List>
      ) : null}

      <Form.Item name="isActive" valuePropName="checked" noStyle>
        <Checkbox>Start monitoring now</Checkbox>
      </Form.Item>
    </>
  );
}

export default ClusterMonitoringTab;
