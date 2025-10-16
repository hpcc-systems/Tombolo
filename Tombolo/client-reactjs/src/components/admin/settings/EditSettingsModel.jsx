// Imports from libraries
import React from 'react';
import { Modal, Card, Form } from 'antd';
import capitalize from 'lodash/capitalize';

// Local imports
import { handleError } from '@/components/common/handleResponse';
import instanceSettingsService from '@/services/instanceSettings.service';
import GeneralSettingsForm from './GeneralSettingsForm';
import SupportSettingsForm from './SupportSettingsForm';

function EditSettingsModel({
  openEditModel,
  setOpenEditModel,
  selectedSetting,
  instanceSettings,
  setInstanceSettings,
}) {
  // Form Refs
  const [generalSettingsForm] = Form.useForm();
  const [supportSettingsForm] = Form.useForm();

  // When cancel button or X is clicked
  const handleClose = () => {
    generalSettingsForm.resetFields();
    supportSettingsForm.resetFields();
    setOpenEditModel(false);
  };

  // When save button is clicked
  const handleSaveEdit = async () => {
    try {
      let updatedSettings = {};
      switch (selectedSetting) {
        case 'general':
          await generalSettingsForm.validateFields();
          updatedSettings = await generalSettingsForm.getFieldsValue();
          break;
        case 'support':
          await supportSettingsForm.validateFields();
          updatedSettings = await supportSettingsForm.getFieldsValue();
          break;
        default:
          break;
      }

      const response = await instanceSettingsService.update(updatedSettings);
      setInstanceSettings(response);
      setOpenEditModel(false);
    } catch (error) {
      handleError('Failed to save settings');
    }
  };

  //  return form based on selected settings
  const getForm = () => {
    switch (selectedSetting) {
      case 'general':
        return <GeneralSettingsForm generalSettingsForm={generalSettingsForm} instanceSettings={instanceSettings} />;
      case 'support':
        return <SupportSettingsForm supportSettingsForm={supportSettingsForm} instanceSettings={instanceSettings} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      open={openEditModel}
      maskClosable={false}
      onCancel={handleClose}
      onOk={handleSaveEdit}
      width={800}
      title={`Edit ${capitalize(selectedSetting)} Settings`}
      okText="Save">
      <Card>{getForm()}</Card>
    </Modal>
  );
}

export default EditSettingsModel;
