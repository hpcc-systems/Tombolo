import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Divider, Spin } from 'antd';
import msLogo from '../../images/mslogo.png';
import { authActions } from '../../redux/actions/Auth';
import { Constants } from '../common/Constants';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const { email, password } = values;
    setLoading(true);

    //get browser and os info and put in deviceInfo variable
    const deviceInfo = {
      os: window.navigator.userAgentData ? window.navigator.userAgentData.platform : navigator.userAgent,
      browser: getBrowserInfo(),
    };

    const test = await authActions.login({ email, password, deviceInfo });

    if (test && test.type === Constants.LOGIN_SUCCESS) {
      window.location.href = '/';
    } else {
      setLoading(false);
    }
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';

    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      browserName = 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
      browserName = 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
    }

    return browserName;
  };

  // if user is logged in, redirect to home page
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.isAuthenticated) {
      //need to validate token is still valid later
      window.location.href = '/';
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
