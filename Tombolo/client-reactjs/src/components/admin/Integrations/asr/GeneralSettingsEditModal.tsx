import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { handleError, handleSuccess } from '../../../common/handleResponse';
import integrationsService from '@/services/integrations.service';

interface Props {
  displayGeneralSettingsEditModal?: boolean;
  setDisplayGeneralSettingsEditModal?: (v: boolean) => void;
  integrationDetails?: any;
  setIntegrationDetails?: (d: any) => void;
  teamsChannels?: any[];
}

const GeneralSettingsEditModal: React.FC<Props> = ({
  displayGeneralSettingsEditModal,
  setDisplayGeneralSettingsEditModal,
  integrationDetails,
  setIntegrationDetails,
  teamsChannels = [],
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (integrationDetails) {
      form.setFieldsValue(integrationDetails.appSpecificIntegrationMetaData || {});
    }
  }, [integrationDetails]);

  const handleOk = async () => {
    try {
      const values = form.getFieldsValue();
      await integrationsService.updateSettings({
        integrationMappingId: integrationDetails?.relationId,
        integrationSettings: values,
      });
      const refreshed = await integrationsService.getDetailsByRelationId({
        relationId: integrationDetails?.relationId,
      });
      setIntegrationDetails && setIntegrationDetails(refreshed);
      handleSuccess('Settings updated');
      setDisplayGeneralSettingsEditModal && setDisplayGeneralSettingsEditModal(false);
    } catch (_err) {
      handleError('Failed to update settings');
    }
  };

  return (
    <Modal
      open={displayGeneralSettingsEditModal}
      onOk={handleOk}
      onCancel={() => setDisplayGeneralSettingsEditModal && setDisplayGeneralSettingsEditModal(false)}>
      <Form form={form} layout="vertical">
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Teams Channel" name="teamsChannel">
          <Select>
            {teamsChannels.map(tc => (
              <Select.Option key={tc.id} value={tc.id}>
                {tc.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GeneralSettingsEditModal;
