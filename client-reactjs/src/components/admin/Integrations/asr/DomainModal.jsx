// Package imports
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Input, Select, message } from 'antd';

//Local Imports
import { createNewDomain, getDomains, updateDomain } from './asr-integration-util.js';

// Constants
const { Option } = Select;

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
      form.setFieldsValue({ name: selectedDomain.name, monitoringTypeIds: activityTypesIds });
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
        <Form.Item
          label="Domain"
          name="name"
          rules={[{ required: true, message: 'Please input the product name!' }, { max: 100 }]}>
          <Input placeholder="Product Name" />
        </Form.Item>
        <Form.Item label="Activity Type" name="monitoringTypeIds" rules={[{ required: false }]}>
          <Select placeholder="Select Activity Type" mode="multiple">
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
