import React, { useEffect, useState } from 'react';
import { userActions } from '../../redux/actions/User';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Divider } from 'antd';

import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

const LoginPage = () => {
  console.log('hi from login');
  const { user, loggedIn } = useSelector((state) => state.authenticationReducer);
  const [login, setLogin] = useState({ loading: false, success: false, error: '' });

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleSubmit = async (values) => {
    try {
      setLogin(() => ({ loading: true, error: '', success: false }));

      const payload = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      };

      const response = await fetch('/api/user/authenticate', payload);
      const data = await response.json();

      if (!response.ok) {
        let message = data?.message || data?.errors || response.statusText;
        if (Array.isArray(message)) message.join(', ');
        throw new Error(message);
      } else {
        if (!data.accessToken) throw new Error('Token not found');
        dispatch(userActions.login(data.accessToken));
        setLogin(() => ({ loading: false, success: true, error: '' }));
      }
    } catch (error) {
      console.log('login fetch error', error);
      setLogin(() => ({ loading: false, success: false, error: error.message }));
    }
  };

  useEffect(() => {
    if (user.id && loggedIn) {
      history.replace(location.state?.from?.pathname || '/');
    }
  }, [loggedIn]);

  return (
    <div className="login-page">
      <Form className="login-form" onFinish={handleSubmit}>
        <h2 className="login-logo">Tombolo</h2>
        <Form.Item name="username" rules={[{ required: true, message: 'Please provide your Username!' }]}>
          <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
        </Form.Item>

        <Form.Item name="password" rules={[{ required: true, message: 'Please provide your Password!' }]}>
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Button loading={login.loading} htmlType="submit" type="primary" block className="login-form-button">
            Log in
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', fontWeight: '450', fontSize: '16px' }}>
          <Link to={'/register'}>Register Now </Link>
          <Divider type="vertical" />
          <Link to={'/forgot-password'}>Forgot Password?</Link>
        </div>

        {login.success && (
          <Form.Item>
            <Alert message="Success" description="You will be redirected shortly" type="success" showIcon />
          </Form.Item>
        )}

        {login.error && (
          <Form.Item>
            <Alert message={(login.error || 'Error') + ', check your inputs and try again'} type="error" showIcon />
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default LoginPage;
