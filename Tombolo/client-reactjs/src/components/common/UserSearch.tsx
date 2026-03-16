import React from 'react';
import { Form, Row, Col, Button, Input } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';

import Text from '../common/Text';

type Props = {
  layout?: any;
  noLabelLayout?: any;
  enableEdit?: boolean;
  showDetails?: boolean;
};

function UserSearch({ layout, noLabelLayout, enableEdit, showDetails }: Props) {
  return (
    <Form.List
      name="notificationRecipients"
      rules={[
        {
          validator: async (_: any, names: any) => {
            if (!names || names.length < 1) {
              return Promise.reject(new Error('Add at least 1 Recipient'));
            }
          },
        },
      ]}>
      {(fields, { add, remove }, { errors }) => {
        if (!enableEdit && !showDetails) return null;
        return (
          <>
            {fields.map((field, index) => (
              <Form.Item
                key={field.key}
                required={!!enableEdit}
                label={index === 0 ? <Text text="Recipients" /> : ''}
                labelAlign="left"
                {...(index === 0 ? layout : noLabelLayout)}
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    type: 'email',
                    message: 'Invalid e-mail address.',
                  },
                ]}>
                <Row gutter={[8, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={21}>
                    <Form.Item
                      noStyle
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          type: 'email',
                          message: 'Invalid e-mail address.',
                        },
                      ]}>
                      {enableEdit ? <Input placeholder="E-mail" /> : <Input className="read-only-input"></Input>}
                    </Form.Item>
                  </Col>
                  {enableEdit ? (
                    <Col span={3}>
                      <MinusCircleOutlined className="dynamic-delete-button" onClick={() => remove(field.name)} />
                    </Col>
                  ) : null}
                </Row>
              </Form.Item>
            ))}
            <Form.Item {...noLabelLayout}>
              {enableEdit ? (
                <Button onClick={() => add()} style={{ margin: '8px 0 8px' }} type="primary" ghost>
                  <Text text="Add notification recipient" />
                </Button>
              ) : null}
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        );
      }}
    </Form.List>
  );
}

export default UserSearch;
