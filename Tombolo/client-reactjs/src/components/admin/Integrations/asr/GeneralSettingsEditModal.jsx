// Package Imports
import React, { useEffect, useState } from 'react';
import { Modal, Form, Checkbox, Select, Card, message } from 'antd';
import { isEmail } from 'validator';

//Local Imports
import { updateIntegrationSettings } from '../integration-utils';

function GeneralSettingsEditModal({
  displayGeneralSettingsEditModal,
  setDisplayGeneralSettingsEditModal,
  integrationDetails,
  setIntegrationDetails,
  teamsChannels,
}) {
  //Local State
  const [displayRecipients, setDisplayRecipients] = useState({
    megaPhoneAlerts: false,
  });

  // Hooks
  const [form] = Form.useForm();

  // Effects
  useEffect(() => {
    const megaPhoneAlertsActive = integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.active;
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];

    // Set display recipients
    setDisplayRecipients({
      megaPhoneAlerts: megaPhoneAlertsActive,
    });

    // Populate form fields
    form.setFieldsValue({
      megaPhoneAlertsActive,
      megaphoneEmailContacts,
      megaPhoneTeamsContacts,
    });
  }, [integrationDetails]);

  // Handle Modal Close
  const handleModalClose = () => {
    form.resetFields();
    setDisplayGeneralSettingsEditModal(false);
  };

  // Handle megaPhoneAlertsActive checkbox change
  const handleMegaPhoneAlertsActiveChange = (e) => {
    setDisplayRecipients({ ...displayRecipients, megaPhoneAlerts: e.target.checked });
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    // If error return
    try {
      await form.validateFields();
    } catch (err) {
      return;
    }

    // Construct payload
    const payload = {
      integrationSettings: {
        megaPhoneAlerts: {
          active: form.getFieldValue('megaPhoneAlertsActive'),
          emailContacts: form.getFieldValue('megaphoneEmailContacts'),
          teamsChannel: form.getFieldValue('megaPhoneTeamsContacts'),
        },
      },
    };

    // Save the payload
    try {
      await updateIntegrationSettings({
        integrationMappingId: integrationDetails.integrationMappingId,
        integrationSettings: payload,
      });

      // Update the integration details
      setIntegrationDetails({
        ...integrationDetails,
        appSpecificIntegrationMetaData: {
          ...integrationDetails.appSpecificIntegrationMetaData,
          ...payload.integrationSettings,
        },
      });

      // reset the form
      form.resetFields();

      handleModalClose();
    } catch (err) {
      message.error('Unable to update the integration settings');
    }
  };

  // JSX
  return (
    <Modal
      title="Edit General Settings"
      open={displayGeneralSettingsEditModal}
      onCancel={handleModalClose}
      width={800}
      okText="Save"
      onOk={handleFormSubmit}
      maskClosable={false}
      cancelButtonProps={{ type: 'primary', ghost: true }}>
      <Card size="small">
        <Form layout="vertical" form={form}>
          <Form.Item name="megaPhoneAlertsActive" valuePropName="checked">
            <Checkbox onChange={handleMegaPhoneAlertsActiveChange}>Activate Megaphone alerts</Checkbox>
          </Form.Item>

          {displayRecipients.megaPhoneAlerts && (
            <>
              <Form.Item
                required
                label="Notification E-mails"
                name="megaphoneEmailContacts"
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value || value.length === 0) {
                        return Promise.reject(new Error('Email required!'));
                      }
                      if (value.length > 20) {
                        return Promise.reject(new Error('Too many emails'));
                      }
                      if (!value.every((v) => isEmail(v))) {
                        return Promise.reject(new Error('Invalid email'));
                      }
                      if (!value.every((v) => isEmail(v) && v.length <= 254)) {
                        return Promise.reject(new Error('One or more  exceed the maximum length'));
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
                />
              </Form.Item>
              <Form.Item label="Notification Webhooks" name="megaPhoneTeamsContacts">
                <Select placeholder="Select a teams Channel " mode="multiple">
                  {teamsChannels.map((channel) => (
                    <Select.Option key={channel.id} value={channel.id}>
                      {channel.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </Modal>
  );
}

export default GeneralSettingsEditModal;
