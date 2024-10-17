import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Divider, Spin, message } from 'antd';
import msLogo from '../../images/mslogo.png';
import { getDeviceInfo } from './utils';
import { authActions } from '../../redux/actions/Auth';
import { Constants } from '../common/Constants';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const { email, password } = values;
    setLoading(true);

    //get browser and os info and put in deviceInfo variable
    const deviceInfo = getDeviceInfo();
    const test = await authActions.login({ email, password, deviceInfo });

    if (test && test.type === Constants.LOGIN_SUCCESS) {
      //reload page if login is succesful
      window.location.href = '/';
    } else {
      setLoading(false);
    }
  };

  //if session expired relay message to user what happened
  useEffect(() => {
    const sessionExpired = localStorage.getItem('sessionExpired');

    if (sessionExpired) {
      localStorage.removeItem('sessionExpired');
      message.error('Session expired. Please log in again.');
    }
  });

  //if session expired relay message to user what happened

  useEffect(() => {
    const sessionExpired = localStorage.getItem('sessionExpired');

    if (sessionExpired) {
      localStorage.removeItem('sessionExpired');
      message.error('Session expired. Please log in again.');
    }
  });

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Divider>Log In With</Divider>
      <Form.Item>
        <Button style={{ background: 'black', color: 'white' }}>
          <img src={msLogo} style={{ height: '3rem', width: 'auto' }} />
        </Button>
      </Form.Item>
      <Divider>Or</Divider>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            whitespace: true,
            type: 'email',
            message: 'Invalid e-mail address.',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input size="large" />
      </Form.Item>
      <Form.Item
        label={
          <>
            <span>Password&nbsp;</span>
          </>
        }
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password size="large" autoComplete="new-password" />
      </Form.Item>
      <a href="/forgot-password">Forgot password?</a>
      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={loading && true}>
          Log in {loading && <Spin style={{ marginLeft: '1rem' }} />}
        </Button>
      </Form.Item>
      <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
        <span>Need an account?</span> <a href="/register">Register</a>
      </p>
    </Form>
  );
};

export default Login;
