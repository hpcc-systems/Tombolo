import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Col, Row, Divider, Popover } from 'antd';
import msLogo from '../../images/mslogo.png';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { authActions } from '../../redux/actions/Auth';

const Register = () => {
  const [popOverContent, setPopOverContent] = useState(null);
  const [form] = Form.useForm();

  const validatePassword = (value) => {
    setPopOverContent(passwordComplexityValidator({ password: value, generateContent: true }));
  };

  useEffect(() => {}, [popOverContent]);

  const onFinish = async (values) => {
    try {
      await authActions.registerBasicUser(values);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Form onFinish={onFinish} layout="vertical" form={form}>
      <Divider>Sign up With</Divider>
      <Form.Item>
        <Button style={{ background: 'black', color: 'white' }}>
          <img src={msLogo} style={{ height: '3rem', width: 'auto' }} />
        </Button>
      </Form.Item>
      {/* Add a row  with 12 columns*/}
      <Divider>Or use your Email</Divider>
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

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Register
        </Button>
      </Form.Item>
      <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
        <span>Already have an account?</span> <a href="/login">Login</a>
      </p>
    </Form>
  );
};

export default Register;
