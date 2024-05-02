import React from 'react';
import { withRouter } from 'react-router';
import { Alert, Button, Form, Input, message } from 'antd';

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      password: '',
      confirmPassword: '',
      submitted: false,
      matched: true,
      error: false,
      success: false,
    };
  }

  componentDidMount() {
    this.setState({ id: this.props.match.params.id });
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.state.confirmPassword !== this.state.password) {
      message.error('Passwords don’t match.');
      return this.setState({ matched: false });
    }

    const strongRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})');
    if (!strongRegex.test(this.state.password)) {
      message.error(
        'Weak Password. To make passwords stronger, it must be minimum 8 characters long, contain upper and lower case letters, numbers, and special characters.'
      );
      return;
    }

    if (this.state.id && this.state.password) {
      this.setState({ submitted: true, success: false, error: false });
      fetch('/api/user/resetPassword', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: this.state.id, password: this.state.password }),
      })
        .then((response) => {
          console.log(response);
          message.config({ top: 110 });
          if (response.ok) {
            message.success('Password has been reset successfully.');
            this.setState({ success: true, submitted: false });
            setTimeout(() => {
              this.props.history.replace('/login');
            }, 2000);
          } else {
            message.error('Invalid or expired reset link');
            this.setState({ error: true, submitted: false });
            response.text().then((text) => {
              console.log('error message: ' + JSON.stringify(JSON.parse(text)));
            });
          }
        })
        .catch((error) => {
          console.log('error', error);
          this.setState({ error: true, submitted: false });
        });
    }
  };

  render() {
    const { password, success, error, confirmPassword } = this.state;
    return (
      <>
        <Form className="login-form" layout="vertical">
          <h2 className="login-logo">Tombolo</h2>

          <Form.Item
            label="New password"
            name="password"
            rules={[{ required: true, message: 'Please provide password!' }]}>
            <Input.Password value={password} name="password" onChange={this.handleChange} placeholder="New Password" />
          </Form.Item>

          <Form.Item
            label="Confirm new password"
            name="confirmPassword"
            rules={[{ required: true, message: 'Please confirm password!' }]}>
            <Input.Password
              value={confirmPassword}
              name="confirmPassword"
              onChange={this.handleChange}
              placeholder="Confirm New Password"
            />
          </Form.Item>

          {success && (
            <Form.Item>
              <Alert
                message="Success"
                description="You will be redirected to login page shortly"
                type="success"
                showIcon
              />
            </Form.Item>
          )}

          {error && (
            <Form.Item>
              <Alert message="Error" description="Failed to reset password." type="error" showIcon />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              loading={this.state.submitted}
              onClick={this.handleSubmit}
              type="primary"
              block
              className="login-form-button">
              {this.state.submitted ? 'Processing...' : 'Reset Password'}
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}
export default withRouter(ResetPassword);
