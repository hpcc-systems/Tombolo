import React from 'react';

import { Alert, Button, Form, Input, message, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      submitted: false,
      success: false,
      sendingEmail: false,
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    if (!this.state.email) {
      return message.error('E-mail required');
    }
    this.setState({ submitted: true });
    if (this.state.email) {
      this.setState({ sendingEmail: true });
      fetch('/api/user/forgot-password', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: this.state.email }),
      }).then((response) => {
        message.config({ top: 110 });
        if (response.ok) {
          this.setState({ sendingEmail: false, success: true });
        } else if (response.status === 422) {
          message.error('Invalid Email');
          this.setState({ sendingEmail: false, submitted: false });
        } else if (response.status === 500) {
          message.error('Unable to send Password reset instructions');
          this.setState({ sendingEmail: false, submitted: false });
        } else {
          this.setState({ sendingEmail: false, submitted: false });
          message.error('Unable to send Password reset instructions');
        }
      });
    }
  };

  render() {
    const { email } = this.state;
    return (
      <div className="login-page">
        <Form className="login-form" layout="vertical">
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

          <Form.Item
            label="E-mail"
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
              value={email}
              name="email"
              onChange={this.handleChange}
              validateTrigger={['onChange', 'onBlur']}
              type="email"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  type: 'email',
                  message: 'Invalid e-mail address.',
                },
              ]}
              placeholder="Email"
            />
          </Form.Item>

          {this.state.success ? (
            <Form.Item>
              <Alert
                message="Success"
                description="Password reset instructions has been sent to your email. "
                type="success"
                showIcon
              />
            </Form.Item>
          ) : null}

          <Form.Item>
            <Button
              loading={this.state.sendingEmail}
              onClick={this.handleSubmit}
              type="primary"
              block
              className="login-form-button">
              {this.state.sendingEmail ? 'Sending reset instructions' : 'Submit'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}
export default ForgotPassword;
