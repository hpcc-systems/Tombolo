import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../common/InfoDrawer';
const { Option } = Select;

const notificationOptions = [
  { label: 'E-mail', value: 'eMail' },
  { label: 'MS Teams', value: 'msTeams' },
];

let notificationConditions = [
  { label: 'Aborted', value: 'aborted' },
  { label: 'Failed', value: 'failed' },
  { label: 'Unknown', value: 'unknown' },
];

function ClusterMonitoringNotificationTab({ notificationDetails, setNotificationDetails, selectedJob }) {
  const [open, setOpen] = useState(false);
  const [notifyConditions, setNotifyConditions] = useState([]);

  // Watch for change in selectedJob
  useEffect(() => {
    const costRelatedOptions = notificationConditions.find((condition) => condition.value === 'maxExecutionCost');
    if (selectedJob && selectedJob.executionCost !== undefined) {
      if (costRelatedOptions === undefined) {
        notificationConditions.push({ label: 'Max execution cost', value: 'maxExecutionCost' });
        notificationConditions.push({ label: 'Max file excess cost ', value: 'maxFileAccessCost' });
        notificationConditions.push({ label: 'Max compile cost ', value: 'maxCompileCost' });
        notificationConditions.push({ label: 'Max total cost ', value: 'maxTotalCost' });
      }
    } else {
      const newOptions = notificationConditions.filter(
        (option) =>
          option.value !== 'maxExecutionCost' &&
          option.value !== 'maxFileAccessCost' &&
          option.value !== 'maxCompileCost' &&
          option.value !== 'maxTotalCost'
      );
      notificationConditions = newOptions;
    }
  }, [selectedJob]);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Form.Item
        label="Notify When"
        name="notificationConditions"
        rules={[{ required: true, message: 'Required filed' }]}>
        <Select
          mode="tags"
          onChange={(selection) => {
            setNotifyConditions(selection);
          }}>
          {notificationConditions.map((condition) => {
            return (
              <Option key={condition.value} value={condition.value}>
                {condition.label}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      <>
        {notifyConditions.includes('maxExecutionCost') ? (
          <Form.Item label="Max Execution Cost" name="maxExecutionCost" style={{ width: '50%' }} required>
            <Input type="number" prefix="$"></Input>
          </Form.Item>
        ) : null}

        {notifyConditions.includes('maxFileAccessCost') ? (
          <Form.Item label="Max File Access Cost" name="maxFileAccessCost" style={{ width: '50%' }} required>
            <Input type="number" prefix="$"></Input>
          </Form.Item>
        ) : null}

        {notifyConditions.includes('maxCompileCost') ? (
          <Form.Item label="Max Compile Cost" name="maxCompileCost" style={{ width: '50%' }} required>
            <Input type="number" prefix="$"></Input>
          </Form.Item>
        ) : null}

        {notifyConditions.includes('maxTotalCost') ? (
          <Form.Item label="Max Total Cost" name="maxTotalCost" style={{ width: '50%' }} required>
            <Input type="number" prefix="$"></Input>
          </Form.Item>
        ) : null}
      </>

      <Form.Item
        label={
          <>
            <p style={{ marginBottom: '0' }}>
              Notification Channel
              <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={() => showDrawer()} />
            </p>
            <InfoDrawer open={open} onClose={onClose} content="webhook"></InfoDrawer>
          </>
        }
        name="notificationChannels"
        rules={[{ required: true, message: 'Required Field' }]}>
        <Select
          options={notificationOptions}
          mode="tags"
          onChange={(value) => {
            setNotificationDetails({ ...notificationDetails, notificationChannel: value });
          }}></Select>
      </Form.Item>

      {notificationDetails?.notificationChannel?.includes('eMail') ? (
        <Form.List name="emails">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, _index) => (
                <Form.Item required={true} key={field.key}>
                  <div style={{ display: 'flex', placeItems: 'center' }}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      type="email"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          type: 'email',
                          message: 'Invalid e-mail address.',
                        },
                      ]}
                      noStyle>
                      <Input placeholder="E-mail" />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined
                        className="dynamic-delete-button"
                        onClick={() => remove(field.name)}
                        style={{ marginLeft: '10px' }}
                      />
                    ) : null}
                  </div>
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  width={'100%'}
                  style={{ width: '100% -10px' }}>
                  Add E-mail
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      ) : null}

      {notificationDetails?.notificationChannel?.includes('msTeams') ? (
        <Form.List name="msTeamsGroups">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, _index) => (
                <Form.Item required={false} key={field.key}>
                  <div style={{ display: 'flex', placeItems: 'center' }}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: 'Invalid Teams webhook URL',
                        },
                      ]}
                      noStyle>
                      <Input placeholder="Teams incoming webhook URL" />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined
                        className="dynamic-delete-button"
                        onClick={() => remove(field.name)}
                        style={{ marginLeft: '10px' }}
                      />
                    ) : null}
                  </div>
                </Form.Item>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: '100% -10px' }}>
                  Add Teams Group
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      ) : null}
    </>
  );
}

export default ClusterMonitoringNotificationTab;
