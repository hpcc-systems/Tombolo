import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Spin, message, Popover } from 'antd';
import { resetTempPassword } from './utils';
import passwordComplexityValidator from '../common/passwordComplexityValidator';

function ResetTempPassword() {
  const [loading, setLoading] = useState(false);
  const [popOverContent, setPopOverContent] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [form] = Form.useForm();

  // For password validator pop over
  const validatePassword = (value) => {
    setPopOverContent(passwordComplexityValidator({ password: value, generateContent: true }));
  };

  // On component load, get the token from the URL
  useEffect(() => {
    const url = window.location.href;
    const urlParts = url.split('/');
    const token = urlParts[urlParts.length - 1];
    setResetToken(token);
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      let values;
      try {
        values = await form.validateFields();
      } catch (err) {
        return;
      }
      values.token = resetToken;
      const result = await resetTempPassword(values);

      // Save user token to local storage
      localStorage.setItem('user', JSON.stringify(result.data));
      window.location.href = '/';
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" form={form} style={{ marginTop: '2rem' }}>
      <Form.Item
        required
        label="Temporary Password"
        name="tempPassword"
        normalize={(value) => value.trim()}
        rules={[
          {
            required: true,
            message: 'Please input your temporary password!',
          },
        ]}>
        <Input.Password size="large" autoComplete="new-temp-password" />
      </Form.Item>
      <Popover placement="right" trigger="focus" title="Password Complexity" content={popOverContent}>
        <Form.Item
          required
          label="New Password"
          name="password"
          normalize={(value) => value.trim()}
          rules={[
            {
              required: true,
              message: 'Please input your new password!',
            },
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
        required
        label="Confirm Password"
        name="confirmPassword"
        normalize={(value) => value.trim()}
        rules={[
          {
            required: true,
            message: 'Please confirm your new password!',
          },
          {
            validator: async (_, value) => {
              if (!value || value === form.getFieldValue('password')) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords that you entered do not match!'));
            },
          },
        ]}>
        <Input.Password size="large" autoComplete="confirm-new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" disabled={loading && true} onClick={handleSubmit} className="fullWidth">
        Reset Password {loading && <Spin style={{ marginLeft: '1rem' }} />}
      </Button>
    </Form>
  );
}

export default ResetTempPassword;
