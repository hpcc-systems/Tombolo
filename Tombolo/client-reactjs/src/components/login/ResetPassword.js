import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Divider, message, Popover } from 'antd';
import { useParams } from 'react-router-dom';
import passwordComplexityValidator from '../common/passwordComplexityValidator';
const ResetPassword = () => {
  const [user, setUser] = useState(null);
  const [popOverContent, setPopOverContent] = useState(null);

  //we will get the reset token from the url and test if it is valid to get the user information
  const { resetToken } = useParams();
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();
  const invalidToken = () => {
    messageApi.open({
      type: 'error',
      content: (
        <>
          <span>
            The reset token provided is either expired or invalid, please go to the{' '}
            <a href="/forgot-password">Forgot Password</a> page to get a new one.
          </span>
        </>
      ),
      duration: 100,
      style: {
        marginTop: '20vh',
      },
    });
  };

  useEffect(() => {
    //check if reset token is valid, if it is, we will get the user ID and store it, if not, we will redirect to the login page
    if (user === null && resetToken !== undefined) {
      //get user information by reset token

      // get user by reset token route

      //if user is found, set user and return
      console.log(setUser);

      //if user is not found, message
      invalidToken();
    }

    if (resetToken === undefined) {
      //redirect to login page
    }
  }, []);

  const onFinish = (values) => {
    console.log('Received values:', values);
    alert('reset password code fires here');
  };

  useEffect(() => {}, [popOverContent]);
  const validatePassword = (value) => {
    setPopOverContent(passwordComplexityValidator({ password: value, generateContent: true }));
  };

  return (
    <Form onFinish={onFinish} layout="vertical" form={form}>
      {contextHolder}
      <Divider>Reset Password</Divider>
      <Popover content={popOverContent} title="Password Complexity" trigger="focus" placement="right">
        <Form.Item
          label={
            <>
              <span>New Password&nbsp;</span>
            </>
          }
          name="newPassword"
          rules={[
            { required: true, message: 'Please input your new password!' },
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
        label={
          <>
            <span>Confirm Password&nbsp;</span>
          </>
        }
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: 'Please confirm your new password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords do not match!'));
            },
          }),
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password size="large" autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={!user?.id} className="fullWidth">
          Reset Password
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetPassword;
