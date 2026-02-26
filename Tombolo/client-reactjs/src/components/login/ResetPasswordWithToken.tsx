import React, { useEffect, useState, useRef } from 'react';
import { Form, Input, Button, Divider, Popover } from 'antd';
import { useParams } from 'react-router-dom';

import passwordComplexityValidator from '../common/passwordComplexityValidator';
import { handleError, handleSuccess } from '../common/handleResponse';
import { getDeviceInfo } from './utils';
import { setUser } from '../common/userStorage';
import authService from '@/services/auth.service';

const ResetPassword: React.FC = () => {
  const [popOverContent, setPopOverContent] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);

  const { resetToken } = useParams<{ resetToken?: string }>();
  const [form] = Form.useForm();

  const finishedTypingRef = useRef(false);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isFirstLoad.current) {
        validatePassword(form.getFieldValue('newPassword'), true);
        finishedTypingRef.current = true;
        form.validateFields(['newPassword']);
      } else {
        isFirstLoad.current = false;
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [form.getFieldValue('newPassword')]);

  const validatePassword = (value: any, checkOldPassword?: boolean) => {
    let pw = value;
    if (!value) pw = '';

    if (userDetails) {
      if (checkOldPassword) {
        setPopOverContent(
          passwordComplexityValidator({ password: pw, user: userDetails, oldPasswordCheck: true }).content
        );
      } else {
        setPopOverContent(passwordComplexityValidator({ password: pw, user: userDetails }).content);
      }
    }
  };

  const onLoad = async () => {
    try {
      const response = await authService.getUserDetailsWithToken(resetToken);

      if (!response || !response.user) {
        handleError('An error occurred while validating the reset token');
        return;
      }

      setUserDetails(response.user);
    } catch (err: any) {
      handleError(err);
    }
  };

  useEffect(() => {
    if (userDetails === null && resetToken !== undefined) {
      onLoad();
    }
  }, [resetToken, userDetails]);

  const invalidToken = () => {
    handleError('The reset token provided is either expired or invalid, please go to the Forgot Password page to get a new one.');
  };

  useEffect(() => {
    if (resetToken === undefined) {
      invalidToken();
    }
  }, []);

  const onFinish = async (values: any) => {
    try {
      const password = values.newPassword;
      const deviceInfo = getDeviceInfo();

      const response = await authService.resetPasswordWithToken({ password, token: resetToken, deviceInfo });

      if (!response) {
        handleError('An error occurred while resetting your password');
        return;
      }

      handleSuccess('Password reset successfully.');
      const userData: any = response;
      userData.isAuthenticated = true;
      setUser(userData);
      window.location.href = '/';
    } catch (err: any) {
      handleError(err);
    }
  };

  useEffect(() => {}, [popOverContent]);

  return (
    <Form onFinish={onFinish} layout="vertical" form={form}>
      <Divider>Reset Password</Divider>
      <Popover content={popOverContent} title="Password Complexity" trigger="focus" placement="right">
        <Form.Item
          label={<><span>New Password&nbsp;</span></>}
          name="newPassword"
          rules={[
            { required: true, message: 'Please input your new password!' },
            { max: 64, message: 'Maximum of 64 characters allowed' },
            () => ({
              validator(_, value: any) {
                if (!value) return Promise.reject();
                if (form.getFieldValue('currentPassword') === value) {
                  return Promise.reject(new Error('New password cannot be the same as the current password!'));
                }
                let result: any;

                if (finishedTypingRef.current) {
                  result = passwordComplexityValidator({ password: value, user: userDetails, oldPasswordCheck: true });
                } else {
                  result = passwordComplexityValidator({ password: value, user: userDetails });
                }

                finishedTypingRef.current = false;

                if (!value || result.errors.length === 1) {
                  return Promise.resolve();
                } else {
                  return Promise.reject(new Error('Password does not meet complexity requirements!'));
                }
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            autoComplete="new-password"
            onChange={(e) => { validatePassword(e.target.value); }}
            onFocus={(e) => { validatePassword(e.target.value, true); }}
            onBlur={(e) => { validatePassword(e.target.value, true); }}
          />
        </Form.Item>
      </Popover>
      <Form.Item
        label={<><span>Confirm Password&nbsp;</span></>}
        name="confirmPassword"
        dependencies={[ 'newPassword' ]}
        rules={[
          { required: true, message: 'Please confirm your new password!' },
          ({ getFieldValue }: any) => ({
            validator(_, value: any) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords do not match!'));
            },
          }),
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}
      >
        <Input.Password size="large" autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="fullWidth">Reset Password</Button>
      </Form.Item>
    </Form>
  );
};

export default ResetPassword;
