import React from 'react';
import { Form, Button, Row, Col, Input } from 'antd/lib';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { formItemLayoutWithOutLabel, formItemLayout } from '../../../common/CommonUtil';

function RecipientsList({ enableEdit, showDetails }) {
  return (
    <Form.List
      name="notificationRecipients"
      className={enableEdit ? null : 'read-only-input'}
      rules={[
        {
          validator: async (_, names) => {
            if (!names || names.length < 1) {
              return Promise.reject(new Error('At least 1 Recipient'));
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => {
        if (!enableEdit && !showDetails) return null;
        return (
          <>
            {fields.map((field, index) => (
              <Form.Item
                key={field.key}
                required={enableEdit}
                label={index === 0 ? 'Recipients' : ''}
                validateTrigger={['onChange', 'onBlur']}
                className={enableEdit ? null : 'read-only-input'}
                {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                rules={[
                  {
                    type: 'email',
                    required: true,
                    whitespace: true,
                    message: 'Please enter a valid email address',
                  },
                ]}
              >
                <Row gutter={[8, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={12}>
                    <Form.Item
                      noStyle
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          type: 'email',
                          required: true,
                          whitespace: true,
                          message: 'Please enter a valid email address',
                        },
                      ]}
                    >
                      <Input placeholder="recipient email" />
                    </Form.Item>
                  </Col>
                  {enableEdit ? (
                    <Col span={3}>
                      <MinusCircleOutlined
                        className="dynamic-delete-button"
                        onClick={() => remove(field.name)}
                      />
                    </Col>
                  ) : null}
                </Row>
              </Form.Item>
            ))}
            {enableEdit ? (
              <Form.Item {...formItemLayoutWithOutLabel}>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ marginBottom: '8px' }}
                >
                  Add Recipient
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            ) : null}
          </>
        );
      }}
    </Form.List>
  );
}

export default RecipientsList;
