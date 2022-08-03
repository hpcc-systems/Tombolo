import React from 'react';
import { Form, Input } from 'antd';
const { TextArea } = Input;

function TextAreaField({ enableEdit, showDetails, label, name, errorMessage, placeholder }) {
  return (
    <Form.Item
      name={name}
      label={label}
      validateTrigger="onBlur"
      hidden={!enableEdit && !showDetails}
      className={enableEdit ? null : 'read-only-input'}
      rules={[{ required: enableEdit, message: errorMessage }]}
    >
      <TextArea
        allowClear={enableEdit}
        placeholder={placeholder}
        autoSize={{ minRows: 1 }}
      />
    </Form.Item>
  );
}

export default TextAreaField;
