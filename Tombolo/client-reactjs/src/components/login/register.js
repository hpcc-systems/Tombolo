import React from 'react';
import { Form, Input, Button, Col, Row, Divider } from 'antd';
import msLogo from '../../images/mslogo.png';

const Register = () => {
  const onFinish = (values) => {
    console.log('Received values of form: ', values);
    // Add your logic to register the user here
    alert('register user code fires here');
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
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
            <Input />
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
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          {
            type: 'email',
            message: 'Please enter a valid email address!',
          },
          {
            required: true,
            message: 'Please input your email!',
          },
          { max: 256, message: 'Maximum of 256 characters allowed' },
        ]}>
        <Input />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Confirm Password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password />
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
