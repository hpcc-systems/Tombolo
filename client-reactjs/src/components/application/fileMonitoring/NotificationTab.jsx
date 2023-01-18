import React, { useEffect } from 'react';
import { Form, Select, Input, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const notificationOptions = [
  { label: 'E-mail', value: 'eMail' },
  { label: 'MS Teams', value: 'msTeams' },
];

function NotificationTab({
  setNotificationDetails,
  notificationDetails,
  notificationTabForm,
  selectedFileMonitoringDetails,
}) {
  // Populate the monitoring details if viewing existing monitoring ---------------------------------
  useEffect(() => {
    if (selectedFileMonitoringDetails === null) return;
    const {
      metaData: { notifications },
    } = selectedFileMonitoringDetails;

    const notificationChannels = [];
    let emails;
    let msTeamsGroups;

    for (let notification in notifications) {
      notificationChannels.push(notifications[notification].channel);

      if (notifications[notification].channel === 'eMail') {
        emails = notifications[notification].recipients;
      }
      if (notifications[notification].channel === 'msTeams') {
        msTeamsGroups = notifications[notification].recipients;
      }
    }

    setNotificationDetails({ ...notificationDetails, notificationChannel: notificationChannels });
    notificationTabForm.setFieldsValue({ emails, notificationChannels, msTeamsGroups });
  }, [selectedFileMonitoringDetails]);

  return (
    <Form
      layout="vertical"
      form={notificationTabForm}
      style={{ width: '50%' }}
      initialValues={{ msTeamsGroups: [''], emails: [''] }}>
      <Form.Item
        label="Notification Channel"
        name="notificationChannels"
        rules={[{ required: true, message: 'Required Field' }]}>
        <Select
          options={notificationOptions}
          mode="tags"
          onChange={(value) => {
            setNotificationDetails({ ...notificationDetails, notificationChannel: value });
          }}></Select>
      </Form.Item>

      {/*  --------------------------------------------------------------------------- */}
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
      {/*  --------------------------------------------------------------------------- */}

      {/*  --------------------------------------------------------------------------- */}
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
      {/*  --------------------------------------------------------------------------- */}
    </Form>
  );
}

export default NotificationTab;

//TODO - Edit file monitoring
