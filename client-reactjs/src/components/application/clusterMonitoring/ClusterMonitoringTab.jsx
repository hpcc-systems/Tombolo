import React, { useState, useEffect } from 'react';
import { Form, Input, Typography, Select, Checkbox } from 'antd';
import cronstrue from 'cronstrue';
import InfoDrawer from '../../common/InfoDrawer';
import { InfoCircleOutlined } from '@ant-design/icons';

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
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

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
        required
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
        label={
          <>
            <p style={{ marginBottom: '0' }}>
              Cron (How often to monitor)
              <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={() => showDrawer()} />
            </p>
            <InfoDrawer open={open} onClose={onClose} width="700px" content="cron"></InfoDrawer>
          </>
        }
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
                  validateTrigger={['onChange', 'onBlur']}
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.reject('Size must be between 1 and 100');
                        }
                        const splittedVal = value.split('');
                        const isLastItemNum = !isNaN(parseInt(splittedVal[splittedVal.length - 1]));

                        if (
                          isLastItemNum &&
                          parseInt(splittedVal[splittedVal.length - 1]) > 0 &&
                          parseInt(splittedVal[splittedVal.length - 1]) <= 100
                        ) {
                          return Promise.resolve();
                        } else {
                          return Promise.reject('Size must be between 1 and 100');
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
