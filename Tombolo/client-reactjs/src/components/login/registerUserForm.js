import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Col, Row, Divider, Popover, Spin } from 'antd';
import passwordComplexityValidator from '../common/passwordComplexityValidator';

//TODO, msenabled should check if microsoft login is enabled
const RegisterUserForm = ({ form, onFinish, ownerRegistration }) => {
  const [popOverContent, setPopOverContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const validatePassword = (value) => {
    setPopOverContent(passwordComplexityValidator({ password: value, generateContent: true }));
  };

  useEffect(() => {}, [popOverContent, loading]);

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      await onFinish(values);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.log(e);
    }
  };

  return (
    <Form onFinish={onSubmit} layout="vertical" form={form}>
      <>{!ownerRegistration ? <Divider /> : null}</>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              {
                required: true,
                message: 'Please input your first name!',
              },
              { max: 64, message: 'Maximum of 64 characters allowed' },
            ]}>
            <Input size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              {
                required: true,
                message: 'Please input your last name!',
              },
              { max: 64, message: 'Maximum of 64 characters allowed' },
            ]}>
            <Input size="large" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          {
            required: true,
            whitespace: true,
            type: 'email',
            message: 'Invalid e-mail address.',
          },
          {
            required: true,
            message: 'Please input your email!',
          },
          { max: 256, message: 'Maximum of 256 characters allowed' },
        ]}>
        <Input size="large" />
      </Form.Item>

      <Popover placement="right" trigger="focus" title="Password Complexity" content={popOverContent}>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            {
              required: true,
              message: 'Please input your password!',
            },
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
        name="confirmPassword"
        label="Confirm Password"
        rules={[
          { required: true, message: 'Please confirm your new password!' },
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

      {!ownerRegistration && (
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={loading && true} className="fullWidth">
            Register {loading && <Spin style={{ marginLeft: '1rem' }} />}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default RegisterUserForm;
