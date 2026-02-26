import React from 'react';
import { Modal, Card, Form } from 'antd';
import capitalize from 'lodash/capitalize';
import { handleError } from '@/components/common/handleResponse';
import instanceSettingsService from '@/services/instanceSettings.service';
import GeneralSettingsForm from './GeneralSettingsForm';
import SupportSettingsForm from './SupportSettingsForm';
import type { FormInstance } from 'antd';

interface InstanceSettings {
  name?: string;
  metaData?: any;
}

interface EditSettingsModelProps {
  openEditModel: boolean;
  setOpenEditModel: (v: boolean) => void;
  selectedSetting: string;
  instanceSettings: InstanceSettings;
  setInstanceSettings: (s: InstanceSettings) => void;
  settings?: Record<string, { id: number; name: string; component: React.ReactNode }>;
}

const EditSettingsModel: React.FC<EditSettingsModelProps> = ({
  openEditModel,
  setOpenEditModel,
  selectedSetting,
  instanceSettings,
  setInstanceSettings,
}) => {
  const [generalSettingsForm] = Form.useForm();
  const [supportSettingsForm] = Form.useForm();

  const handleClose = () => {
    generalSettingsForm.resetFields();
    supportSettingsForm.resetFields();
    setOpenEditModel(false);
  };

  const handleSaveEdit = async () => {
    try {
      let updatedSettings: any = {};
      switch (selectedSetting) {
        case 'general':
          await (generalSettingsForm as FormInstance).validateFields();
          updatedSettings = (generalSettingsForm as FormInstance).getFieldsValue();
          break;
        case 'support':
          await (supportSettingsForm as FormInstance).validateFields();
          updatedSettings = (supportSettingsForm as FormInstance).getFieldsValue();
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
};

export default EditSettingsModel;
