// Package Imports
import React, { useEffect, useState } from 'react';
import { Modal, Form, Checkbox, Select, Card, message } from 'antd';
import { isEmail } from 'validator';

//Local Imports
const { updateIntegrationSettings } = require('../integration-utils.js');

function GeneralSettingsEditModal({
  displayGeneralSettingsEditModal,
  setDisplayGeneralSettingsEditModal,
  integrationDetails,
  setIntegrationDetails,
  teamsChannels,
}) {
  //Local State
  const [displayRecipients, setDisplayRecipients] = useState({
    severity3Alerts: false,
    megaPhoneAlerts: false,
  });

  // Hooks
  const [form] = Form.useForm();

  // Effects
  useEffect(() => {
    const severity3AlertsActive = integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.active;
    const megaPhoneAlertsActive = integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.active;
    const severity3EmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.emailContacts || [];
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];

    // Set display recipients
    setDisplayRecipients({
      severity3Alerts: severity3AlertsActive,
      megaPhoneAlerts: megaPhoneAlertsActive,
    });

    // Populate form fields
    form.setFieldsValue({
      severity3AlertsActive,
      severity3EmailContacts,
      megaPhoneAlertsActive,
      megaphoneEmailContacts,
      megaPhoneTeamsContacts,
    });
  }, [integrationDetails]);

  // Handle Modal Close
  const handleModalClose = () => {
    setDisplayGeneralSettingsEditModal(false);
  };

  // Handle severity3AlertsActive checkbox change
  const handleSeverity3AlertsActiveChange = (e) => {
    setDisplayRecipients({ ...displayRecipients, severity3Alerts: e.target.checked });
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
        severity3Alerts: {
          active: form.getFieldValue('severity3AlertsActive'),
          emailContacts: form.getFieldValue('severity3EmailContacts'),
        },
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
          <Form.Item name="severity3AlertsActive" valuePropName="checked">
            <Checkbox onChange={handleSeverity3AlertsActiveChange}>Activate Severity-3 alerts</Checkbox>
          </Form.Item>
          {displayRecipients.severity3Alerts && (
            <Form.Item
              required
              name="severity3EmailContacts"
              label="Severity 3 Notification Emails"
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
              />
            </Form.Item>
          )}

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
