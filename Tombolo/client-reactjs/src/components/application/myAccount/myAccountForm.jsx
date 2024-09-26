import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Col, Row, Popover } from 'antd';
import passwordComplexityValidator from '../../common/passwordComplexityValidator';

const MyAccountForm = () => {
  const [popOverContent, setPopOverContent] = useState(null);
  const [form] = Form.useForm();

  const validatePassword = (value) => {
    setPopOverContent(passwordComplexityValidator({ password: value, generateContent: true }));
  };

  useEffect(() => {}, [popOverContent]);

  const onFinish = (values) => {
    console.log('Received values of form: ', values);
    // Add your logic to register the user here
    alert('register user code fires here');
  };

  return (
    <div style={{ width: '50%' }}>
      <Form form={form} onFinish={onFinish} layout="vertical">
        {/* first name, last name, password, confirm password fields */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ max: 64, message: 'Maximum of 64 characters allowed' }]}>
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ max: 64, message: 'Maximum of 64 characters allowed' }]}>
              <Input size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Popover placement="right" trigger="focus" title="Password Complexity" content={popOverContent}>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { max: 64, message: 'Maximum of 64 characters allowed' },
              () => ({
                validator(_, value) {
                  //passwordComplexityValidator always returns an array with at least one attributes element
                  const errors = passwordComplexityValidator({ password: value });
                  if (!value || errors.length === 1) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Password does not meet complexity requirements!'));
                },
              }),
            ]}>
            <Input.Password
              size="large"
              autoComplete="new-password"
              onChange={(e) => {
                validatePassword(e.target.value);
              }}
              onFocus={(e) => {
                validatePassword(e.target.value);
              }}
            />
          </Form.Item>
        </Popover>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          rules={[
            { max: 64, message: 'Maximum of 64 characters allowed' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}>
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          style={{
            width: '100%',
            marginTop: '1rem',
            marginBottom: '1rem',

            height: 'fit-content',
            minHeight: '3.5rem',
            fontSize: '1.25rem',
          }}>
          Save
        </Button>
      </Form>
    </div>
  );
};

export default MyAccountForm;
