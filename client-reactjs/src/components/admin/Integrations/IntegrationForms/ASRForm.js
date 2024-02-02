import React from 'react';
import { useEffect } from 'react';
import { Form, Input, Switch, Tabs } from 'antd';

const { TabPane } = Tabs;

const ASRForm = ({ setNotifications, notifications, setActive, selectedIntegration }) => {
  const [notificationForm] = Form.useForm();

  useEffect(() => {
    console.log('setting fields values');
    console.log(selectedIntegration);

    notificationForm.setFieldsValue({
      notificationEmailsSev3: selectedIntegration?.metaData?.notificationEmailsSev3,
      megaphone: selectedIntegration?.config?.megaphoneActive,
      notificationEmails: selectedIntegration?.metaData?.notificationEmails,
      notificationWebhooks: selectedIntegration?.metaData?.notificationWebhooks,
    });
  }, [selectedIntegration]);

  return (
    <>
      <Form layout="vertical" form={notificationForm}>
        <Tabs tabPosition="left">
          <TabPane tab="General" key="1">
            <h3>General</h3>
            <Form.Item
              label="Severity 3 Notification Emails"
              style={{ width: '100%' }}
              name="notificationEmailsSev3"
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ max: 256, message: 'Maximum of 256 characters allowed' }]}>
              <Input
                onChange={(e) =>
                  setNotifications({ ...notifications, notificationEmailsSev3: e.target.value })
                }></Input>
            </Form.Item>
          </TabPane>
          <TabPane tab="Megaphone" key="2">
            <h3>Megaphone</h3>
            <Form.Item name="megaphone" label="Active">
              <Switch
                defaultChecked={selectedIntegration?.config?.megaphoneActive || false}
                onChange={(e) => {
                  setActive(e);
                }}></Switch>
            </Form.Item>
            <Form.Item
              label="Notification Emails"
              style={{ width: '100%' }}
              name="notificationEmails"
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ max: 256, message: 'Maximum of 256 characters allowed' }]}>
              <Input
                onChange={(e) => setNotifications({ ...notifications, notificationEmails: e.target.value })}></Input>
            </Form.Item>
            <Form.Item
              label="Notification Webhooks"
              style={{ width: '100%' }}
              name="notificationWebhooks"
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ max: 256, message: 'Maximum of 256 characters allowed' }]}>
              <Input
                onChange={(e) => setNotifications({ ...notifications, notificationWebhooks: e.target.value })}></Input>
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </>
  );
};
export default ASRForm;
