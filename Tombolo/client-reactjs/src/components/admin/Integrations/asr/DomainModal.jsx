// Package imports
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Select, message, Row, Col } from 'antd';
import { isEmail } from 'validator';

//Local Imports
import { createNewDomain, getDomains, updateDomain } from './asr-integration-util.js';

// Constants
const { Option } = Select;
const severityThresholds = [0, 1, 2, 3];
const regions = ['UK', 'USA'];

const DomainModal = ({
  domainModalOpen,
  setDomainModalOpen,
  monitoringTypes,
  setDomains,
  domains,
  selectedDomain,
  setSelectedDomain,
}) => {
  const [form] = Form.useForm();

  //Effects
  useEffect(() => {
    if (selectedDomain) {
      let activityTypesIds = selectedDomain.activityTypes.map((d) => d.id);
      activityTypesIds = activityTypesIds.filter((id) => id !== null);
      form.setFieldsValue({
        name: selectedDomain.name,
        region: selectedDomain.region,
        severityThreshold: selectedDomain.severityThreshold,
        monitoringTypeIds: activityTypesIds,
        severityAlertRecipients: selectedDomain.severityAlertRecipients,
      });
    }
  }, [selectedDomain]);

  //Redux
  const {
    authenticationReducer: {
      user: { firstName, lastName, email },
    },
  } = useSelector((state) => state);

  // Update Domain
  const saveUpdatedDomain = async () => {
    // Validate form
    try {
      await form.validateFields();
    } catch (err) {
      return;
    }

    // Save domain
    try {
      const payload = form.getFieldsValue();
      payload.updatedBy = { firstName, lastName, email };
      await updateDomain({ id: selectedDomain.id, payload });
      // Get all domains and replace the current domains with the new ones
      const domains = await getDomains();
      setDomains(domains);
      message.success('Domain updated successfully');
      setSelectedDomain(null);
      form.resetFields();
      setDomainModalOpen(false);
    } catch (err) {
      message.error('Failed to update domain');
    }
  };

  // Create/save new domain
  const saveDomain = async () => {
    // Validate form
    try {
      await form.validateFields();
    } catch (err) {
      return;
    }

    //Check if name is already taken
    const name = form.getFieldValue('name');
    const domainExists = domains.some((domain) => domain.name === name);
    if (domainExists) {
      message.error('Domain  already exists');
      return;
    }

    // Save domain
    try {
      const payload = form.getFieldsValue();
      payload.createdBy = { firstName, lastName, email };

      await createNewDomain({ payload });
      // Get all domains and replace the current domains with the new ones
      const domains = await getDomains();
      setDomains(domains);
      message.success('Domain saved successfully');
      form.resetFields();
      setDomainModalOpen(false);
    } catch (err) {
      message.error('Failed to save domain');
    }
  };

  // const handle form submission
  const handleFromSubmission = () => {
    if (selectedDomain) {
      saveUpdatedDomain();
    } else {
      saveDomain();
    }
  };

  // When cancel button or close icon is clicked
  const handleCancel = () => {
    setSelectedDomain(null);
    form.resetFields();
    setDomainModalOpen(false);
  };

  // JSX return
  return (
    <Modal
      title={selectedDomain ? 'Edit Domain' : 'Add Domain'}
      open={domainModalOpen}
      onOk={handleFromSubmission}
      onCancel={handleCancel}
      width={800}
      okText={selectedDomain ? 'Update' : 'Save'}
      maskClosable={false}>
      <Form form={form} layout="vertical">
        <Row gutter={8}>
          <Col span={10}>
            <Form.Item
              label="Domain"
              name="name"
              rules={[{ required: true, message: 'Please input the product name!' }, { max: 100 }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col span={7}>
            <Form.Item label="Region" name="region" rules={[{ required: true, message: 'Please Select a region' }]}>
              <Select>
                {regions.map((region) => (
                  <Option key={region} value={region}>
                    {region}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={7}>
            <Form.Item
              label="Severity Threshold"
              rules={[{ required: true, message: 'Severity threshold is required' }]}
              name="severityThreshold">
              <Select>
                {severityThresholds.map((severity) => (
                  <Option key={severity} value={severity}>
                    {severity}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Severity E-mail Recipients"
          name="severityAlertRecipients"
          required
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

        <Form.Item label="Activity Type(s)" name="monitoringTypeIds" rules={[{ required: false }]}>
          <Select mode="multiple">
            {monitoringTypes.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DomainModal;
