import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Popover } from 'antd';
import passwordComplexityValidator from '../../common/passwordComplexityValidator';

const ChangePasswordModal = ({ changePasswordModalVisible, setChangePasswordModalVisible }) => {
  const [form] = Form.useForm();
  const [popOverContent, setPopOverContent] = useState(null);

  const handleOk = () => {
    setChangePasswordModalVisible(false);
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
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>

          <Button key="modify" type="primary" onClick={() => handleOk()}>
            Save
          </Button>
        </>
      }>
      <Form layout="vertical" form={form}>
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
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
