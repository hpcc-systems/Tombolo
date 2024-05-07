// Package Imports
import React, { useEffect, useState } from 'react';
import { Modal, Form, Checkbox, Select, Card, message, Row, Col, Input } from 'antd';
import { isEmail } from 'validator';

//Local Imports
const { updateIntegrationSettings } = require('../integration-utils.js');

// Constants
const { Option } = Select;
const severityLevels = [
  { value: '0', label: 'All Levels (0 and above)' },
  { value: '1', label: '1 and above' },
  { value: '2', label: '2 and above' },
  { value: '3', label: 'Only 3' },
];

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
    nocAlerts: false,
  });

  // Hooks
  const [form] = Form.useForm();

  // Effects
  useEffect(() => {
    const severity3AlertsActive = integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.active;
    const megaPhoneAlertsActive = integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.active;
    const nocAlertsActive = integrationDetails?.appSpecificIntegrationMetaData?.nocAlerts?.active;
    const severityLevelForNocAlerts =
      integrationDetails?.appSpecificIntegrationMetaData?.nocAlerts?.severityLevelForNocAlerts;

    const severity3EmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.emailContacts || [];
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];
    const nocEmailContacts = integrationDetails?.appSpecificIntegrationMetaData?.nocAlerts?.emailContacts || [];

    // Set display recipients
    setDisplayRecipients({
      severity3Alerts: severity3AlertsActive,
      megaPhoneAlerts: megaPhoneAlertsActive,
      nocAlerts: nocAlertsActive,
    });

    // Populate form fields
    form.setFieldsValue({
      severity3AlertsActive,
      severity3EmailContacts,
      nocAlertsActive,
      nocEmailContacts: nocEmailContacts[0],
      severityLevelForNocAlerts,
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

  // Handle severity3AlertsActive checkbox change
  const handleSeverity3AlertsActiveChange = (e) => {
    setDisplayRecipients({ ...displayRecipients, severity3Alerts: e.target.checked });
  };

  // Handle megaPhoneAlertsActive checkbox change
  const handleMegaPhoneAlertsActiveChange = (e) => {
    setDisplayRecipients({ ...displayRecipients, megaPhoneAlerts: e.target.checked });
  };

  // When activate noc alerts checkbox is changed
  const handleNocAlertsActiveChange = (e) => {
    setDisplayRecipients({ ...displayRecipients, nocAlerts: e.target.checked });
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
        nocAlerts: {
          active: form.getFieldValue('nocAlertsActive'),
          severityLevelForNocAlerts: form.getFieldValue('severityLevelForNocAlerts'),
          emailContacts: [form.getFieldValue('nocEmailContacts')],
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
                      return Promise.reject(new Error('E-mail is required!'));
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
                        return Promise.reject(new Error('Email required!'));
                      }
                      if (value.length > 20) {
                        return Promise.reject(new Error('Too many emails'));
                      }
                      if (!value.every((v) => isEmail(v))) {
                        return Promise.reject(new Error('Invalid email'));
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

          <Form.Item name="nocAlertsActive" valuePropName="checked">
            <Checkbox onChange={handleNocAlertsActiveChange}>Activate NOC alerts</Checkbox>
          </Form.Item>

          {displayRecipients.nocAlerts && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="severityLevelForNocAlerts"
                  label="Severity level for NOC alerts"
                  required
                  rules={[{ required: true, message: 'Severity level is required' }]}>
                  <Select allowClear={true}>
                    {severityLevels.map((level) => (
                      <Option key={level.value} value={level.value}>
                        {level.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  required
                  name="nocEmailContacts"
                  label="NOC Notification Email"
                  // validateTrigger={['onBlur']}
                  rules={[
                    { required: true, message: 'Email is required' },
                    {
                      validator: (_, value) => {
                        if (value && !isEmail(value)) {
                          return Promise.reject(new Error('Email is invalid'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <Input allowClear placeholder="Enter NOC email address" tokenSeparators={[',']} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Card>
    </Modal>
  );
}

export default GeneralSettingsEditModal;
