import React from 'react';
import { Form, Input } from 'antd';
import type { FormInstance } from 'antd';

interface InstanceSettings {
  name?: string;
  metaData?: any;
}

interface GeneralSettingsFormProps {
  generalSettingsForm: FormInstance;
  instanceSettings: InstanceSettings;
}

const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({ generalSettingsForm, instanceSettings }) => {
  return (
    <Form
      form={generalSettingsForm}
      layout="vertical"
      initialValues={{ name: instanceSettings?.name, description: instanceSettings?.metaData?.description }}>
      <Form.Item
        label="Instance Name"
        name="name"
        required
        rules={[
          { required: true, message: 'Instance name is required' },
          { max: 255, message: 'Name must be less than 255 characters' },
        ]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        required
        rules={[
          { required: true, message: 'Description is required' },
          { max: 500, message: 'Description must be less than 500 characters' },
        ]}>
        <Input.TextArea autoSize={{ minRows: 4, maxRows: 8 }} />
      </Form.Item>
    </Form>
  );
};

export default GeneralSettingsForm;
