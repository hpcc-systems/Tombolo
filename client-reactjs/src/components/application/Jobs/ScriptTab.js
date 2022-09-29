import { Form, Input } from 'antd';
import React from 'react';
import ReadOnlyField from '../../common/ReadOnlyFied';
import Text from '../../common/Text';

const ScriptTab = ({ enableEdit, editingAllowed }) => {
  const longFieldLayout = {
    labelCol: { span: 2 },
    wrapperCol: { span: 12 },
  };

  return (
    <Form.Item
      {...longFieldLayout}
      label={<Text text="Script Path" />}
      name="scriptPath"
      validateTrigger="onBlur"
      rules={[
        {
          required: enableEdit,
          pattern: new RegExp(/[a-zA-Z~`_'".-]+$/i),
          message: 'Please enter a valid path',
        },
      ]}>
      {enableEdit ? <Input placeholder="Main script path" disabled={!editingAllowed} /> : <ReadOnlyField />}
    </Form.Item>
  );
};

export default ScriptTab;
