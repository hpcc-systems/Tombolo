import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Popover, message, Spin } from 'antd';
import passwordComplexityValidator from '../../common/passwordComplexityValidator';
import { changeBasicUserPassword } from './utils';

const ChangePasswordModal = ({ changePasswordModalVisible, setChangePasswordModalVisible }) => {
  const [form] = Form.useForm();
  const [popOverContent, setPopOverContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    setLoading(true);
    // Validate from and set validForm to false if any field is invalid
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    if (validForm) {
      const values = form.getFieldsValue();

      const data = await changeBasicUserPassword(values);

      if (data) {
        message.success('Password changed successfully');
        setChangePasswordModalVisible(false);
        form.resetFields();
      }
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setChangePasswordModalVisible(false);
  };

  useEffect(() => {}, [popOverContent]);

  const validatePassword = (value) => {
    setPopOverContent(passwordComplexityValidator({ password: value, generateContent: true }));
  };

  return (
    <Modal
      title="Change Password"
      open={changePasswordModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={
        <>
          <Button key="cancel" onClick={handleCancel} disabled={loading && true}>
            Cancel
          </Button>

          <Button key="modify" type="primary" onClick={() => handleOk()} disabled={loading && true}>
            Save {loading && <Spin style={{ marginLeft: '1rem' }} />}
          </Button>
        </>
      }>
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Current Password"
          name="currentPassword"
          rules={[{ required: true, message: 'Please input your current password!' }]}>
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
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
                  if (!value) {
                    return Promise.reject();
                  }
                  //make sure it doesn't equal current password
                  if (form.getFieldValue('currentPassword') === value) {
                    return Promise.reject(new Error('New password cannot be the same as the current password!'));
                  }
                  //passwordComplexityValidator always returns an array with at least one attributes element
                  const errors = passwordComplexityValidator({ password: value });
                  if (!value || errors.length === 1) {
                    return Promise.resolve();
                  } else {
                    return Promise.reject(new Error('Password does not meet complexity requirements!'));
                  }
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
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;