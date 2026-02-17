import React from 'react';
import { Form, Input } from 'antd';
import { DescriptionFormRules, InstanceNameFormRules } from '../common/FormRules';
import type { FormInstance } from 'antd';

interface Props {
  instanceForm: FormInstance<any>;
}

const InstanceSettings: React.FC<Props> = ({ instanceForm }) => {
  return (
    <Form form={instanceForm} layout="vertical">
      <Form.Item label="Instance Name" name="name" rules={InstanceNameFormRules}>
        <Input />
      </Form.Item>
      <Form.Item label="Instance Description" name="description" rules={DescriptionFormRules}>
        <Input.TextArea rows={5} />
      </Form.Item>
    </Form>
  );
};

export default InstanceSettings;
