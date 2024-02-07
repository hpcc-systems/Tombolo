import React from 'react';
import { useEffect, useState } from 'react';
import { Form, Select, Switch, Tabs, message } from 'antd';
import { isEmail } from 'validator';
import { getAllTeamsHook } from '../../../application/jobMonitoring/jobMonitoringUtils';

const { TabPane } = Tabs;
const { Option } = Select;

const ASRForm = ({ setNotifications, notifications, setActive, selectedIntegration }) => {
  const [notificationForm] = Form.useForm();
  const [teamsHooks, setTeamsHook] = useState([]);

  useEffect(() => {
    //Get all teams hook
    (async () => {
      try {
        const allTeamsHook = await getAllTeamsHook();
        setTeamsHook(allTeamsHook);
      } catch (error) {
        message.error('Error fetching teams hook');
      }
    })();
  }, []);

  useEffect(() => {
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
        <Tabs type="card">
          <TabPane tab="General" key="1">
            <h3>General</h3>
            <Form.Item
              label="Severity 3 Notification Emails"
              style={{ width: '100%' }}
              name="notificationEmailsSev3"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(new Error('Please add at least one email!'));
                    }
                    if (value.length > 20) {
                      return Promise.reject(new Error('Too many emails'));
                    }
                    if (!value.every((v) => isEmail(v))) {
                      return Promise.reject(new Error('One or more emails are invalid'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}>
              <Select
                mode="tags"
                allowClear
                placeholder="Enter a comma-delimited list of email addresses"
                tokenSeparators={[',']}
                onChange={(e) => {
                  setNotifications({ ...notifications, notificationEmailsSev3: e });
                }}
              />
            </Form.Item>
          </TabPane>
          <TabPane tab="Megaphone" key="2">
            <h3>Megaphone</h3>
            <Form.Item name="megaphone" label="Active">
              <Switch
                checked={selectedIntegration?.config?.megaphoneActive || false}
                onChange={(e) => {
                  setActive(e);
                }}></Switch>
            </Form.Item>
            <Form.Item
              label="Notification Emails"
              style={{ width: '100%' }}
              name="notificationEmails"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(new Error('Please add at least one email!'));
                    }
                    if (value.length > 20) {
                      return Promise.reject(new Error('Too many emails'));
                    }
                    if (!value.every((v) => isEmail(v))) {
                      return Promise.reject(new Error('One or more emails are invalid'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}>
              <Select
                mode="tags"
                allowClear
                placeholder="Enter a comma-delimited list of email addresses"
                tokenSeparators={[',']}
                onChange={(e) => {
                  setNotifications({ ...notifications, notificationEmails: e });
                }}
              />
            </Form.Item>
            <Form.Item
              label="Notification Webhooks"
              style={{ width: '100%' }}
              name="notificationWebhooks"
              validateTrigger={['onChange', 'onBlur']}>
              <Select
                placeholder="Select a teams Channel "
                mode="multiple"
                onChange={([e]) => {
                  setNotifications({ ...notifications, notificationWebhooks: e });
                }}>
                {teamsHooks.map((team) => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </>
  );
};
export default ASRForm;
