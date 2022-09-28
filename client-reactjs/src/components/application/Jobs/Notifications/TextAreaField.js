import React from 'react';
import { Form, Input } from 'antd';

import { i18n } from '../../../common/Text';

const { TextArea } = Input;

function TextAreaField({ enableEdit, showDetails, label, name, errorMessage, placeholder }) {
  return (
    <Form.Item
      name={name}
      label={i18n(label)}
      validateTrigger="onBlur"
      hidden={!enableEdit && !showDetails}
      className={enableEdit ? null : 'read-only-input'}
      rules={[{ required: enableEdit, message: errorMessage }]}>
      <TextArea allowClear={enableEdit} placeholder={i18n(placeholder)} autoSize={{ minRows: 1 }} />
    </Form.Item>
  );
}

export default TextAreaField;
