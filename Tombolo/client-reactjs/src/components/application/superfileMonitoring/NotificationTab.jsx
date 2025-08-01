import React, { useEffect, useState } from 'react';
import { Form, Select, Input, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../common/InfoDrawer';

import styles from './superfileMonitoring.module.css';

const notificationOptions = [
  { label: 'E-mail', value: 'eMail' },
  { label: 'MS Teams', value: 'msTeams' },
];

const NotificationTab = ({ setNotificationDetails, notificationDetails, selectedFileMonitoringDetails }) => {
  useEffect(() => {}, [selectedFileMonitoringDetails]);
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
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
                  <div className={styles.emailsList}>
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
                  <div className={styles.emailsList}>
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
};

export default NotificationTab;

//TODO - Edit file monitoring
