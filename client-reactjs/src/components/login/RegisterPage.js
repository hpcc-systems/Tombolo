import React, { useEffect } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, message, Tooltip } from 'antd';

import { Link, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';

const RegisterPage = () => {
  const { loggedIn } = useSelector((state) => state.authenticationReducer);
  const [register, setRegister] = useState({ loading: false, success: false, error: '' });

  const history = useHistory();

  const handleSubmit = async (values) => {
    try {
      setRegister(() => ({ loading: true, error: '', success: false }));

      const payload = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          username: values.username,
          password: values.password,
          confirmPassword: values.confirmPassword,
          role: 'Creator',
        }),
      };

      const response = await fetch('/api/user/registerUser', payload);
      const data = await response.json();

      if (!response.ok) {
        let message = data?.message || data?.errors || response.statusText;
        if (Array.isArray(message)) message.join(', ');
        throw new Error(message);
      } else {
        setRegister(() => ({ loading: false, error: '', success: true }));
      }
    } catch (error) {
      console.log('register error', error);
      setRegister(() => ({ loading: false, error: error.message, success: false }));
    }
  };

  useEffect(() => {
    if (loggedIn) history.replace('/');

    if (register.success) {
      setTimeout(() => {
        message.success('Success, please login with your new account');
        history.replace('/login');
      }, 2000);
    }
  }, [register.success]);

  return (
    <div className="login-page">
      <Form className="login-form" labelAlign="left" onFinish={handleSubmit} layout="vertical">
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute' }}>
            <Tooltip placement="right" title={'Back to Login'}>
              <Link to="/login">
                <ArrowLeftOutlined />
              </Link>
            </Tooltip>
          </div>
          <h2 className="login-logo">Tombolo</h2>
        </div>

        <Form.Item label="Name" required>
          <Form.Item
            // label="First name"
            name="firstName"
            validateTrigger={['onSubmit', 'onChange']}
            style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
            rules={[
              { required: true, message: 'Please provide your first name!' },
              { pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z ]*$/), message: 'Letters and white spaces only' },
            ]}>
            <Input placeholder="First name" />
          </Form.Item>

          <Form.Item
            // label="Last Name"
            name="lastName"
            validateTrigger={['onSubmit', 'onChange']}
            style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 8px' }}
            rules={[
              { required: true, message: 'Please provide your last name!' },
              { pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z ]*$/), message: 'Letters and white spaces only' },
            ]}>
            <Input placeholder="Last name" />
          </Form.Item>
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          validateTrigger={['onChange', 'onBlur']}
          type="email"
          rules={[
            {
              required: true,
              whitespace: true,
              type: 'email',
              message: 'Invalid e-mail address.',
            },
          ]}>
          <Input
            type="email"
            placeholder="Email"
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              {
                required: true,
                whitespace: true,
                type: 'email',
                message: 'Invalid e-mail address.',
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Username"
          name="username"
          validateTrigger={['onSubmit', 'onChange']}
          rules={[
            { required: true, message: 'Please provide your username!' },
            { pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z0-9]*$/), message: 'Letters and numbers only' },
          ]}>
          <Input placeholder="Username" />
        </Form.Item>

        <Form.Item label="Password" required>
          <Form.Item
            // label="Password"
            name="password"
            style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
            rules={[
              { required: true, message: 'Please provide your password!' },
              {
                pattern: new RegExp(/(?=^.{8,}$)(?=.*\d)(?=.*[!@#$%^&*]+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/),
                message:
                  'Password must be minimum 8 characters, at least one uppercase, one lower case, one number and one of these special characters - @#$%^&*',
              },
            ]}>
            <Input.Password type="password" placeholder="Password" />
          </Form.Item>

          <Form.Item
            // label="Confirm"
            name="confirmPassword"
            validateTrigger={['onBlur', 'onSubmit', 'onChange']}
            style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 8px' }}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              (ctx) => ({
                validator: (_, value) => {
                  return !value || ctx.getFieldValue('password') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('The two passwords that you entered do not match!'));
                },
              }),
            ]}>
            <Input.Password type="password" placeholder="Confirm Password" />
          </Form.Item>
        </Form.Item>

        <Form.Item>
          <Button loading={register.loading} htmlType="submit" type="primary" block className="login-form-button">
            Register
          </Button>
        </Form.Item>

        {register.success && (
          <Form.Item>
            <Alert message="Success" description="You will be redirected shortly" type="success" showIcon />
          </Form.Item>
        )}

        {register.error && (
          <Form.Item>
            <Alert message="Error" description={register.error || 'Failed to register user.'} type="error" showIcon />
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default RegisterPage;
