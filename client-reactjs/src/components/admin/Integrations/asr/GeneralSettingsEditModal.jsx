import React from 'react';
import { Modal, Form, Checkbox, Select, Card } from 'antd';
import { isEmail } from 'validator';

function GeneralSettingsEditModal({ displayGeneralSettingsEditModal, setDisplayGeneralSettingsEditModal }) {
  // Handle Modal Close
  const handleModalClose = () => {
    setDisplayGeneralSettingsEditModal(false);
  };

  return (
    <Modal
      title="Edit General Settings"
      open={displayGeneralSettingsEditModal}
      onCancel={handleModalClose}
      width={800}
      okText="Save"
      cancelButtonProps={{ type: 'primary', ghost: true }}>
      <Card size="small">
        <Form layout="vertical">
          <Form.Item>
            <Checkbox>Activate Severity-3 alerts</Checkbox>
          </Form.Item>
          <Form.Item
            label="Severity 3 Notification Emails"
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
              // onChange={(e) => {
              //   setNotifications({ ...notifications, notificationEmailsSev3: e });
              // }}
            />
          </Form.Item>

          <Form.Item>
            <Checkbox>Activate Megaphone alerts</Checkbox>
          </Form.Item>
          <Form.Item label="Notification E-mails">
            <Select
              mode="tags"
              allowClear
              placeholder="Enter a comma-delimited list of email addresses"
              tokenSeparators={[',']}
            />
          </Form.Item>
          <Form.Item label="Notification Webhooks" name="notificationWebhooks" validateTrigger={['onChange', 'onBlur']}>
            <Select placeholder="Select a teams Channel " mode="multiple"></Select>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
}

export default GeneralSettingsEditModal;
