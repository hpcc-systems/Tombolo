import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, Popover, Spin } from 'antd';

import passwordComplexityValidator from '../../common/passwordComplexityValidator';
import { getUser } from '../../common/userStorage';
import { handleSuccess } from '../../common/handleResponse';
import usersService from '@/services/users.service';

interface Props {
  changePasswordModalVisible: boolean;
  setChangePasswordModalVisible: (v: boolean) => void;
}

const ChangePasswordModal: React.FC<Props> = ({ changePasswordModalVisible, setChangePasswordModalVisible }) => {
  const [form] = Form.useForm();
  const [popOverContent, setPopOverContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    // Intentionally checking the value to detect typing changes
  }, [form.getFieldValue('newPassword')]);

  const validatePassword = (value: string, checkOldPassword?: boolean) => {
    let pw = value;
    if (!value) pw = '';

    const user = getUser();

    if (checkOldPassword) {
      setPopOverContent(passwordComplexityValidator({ password: pw, user, oldPasswordCheck: true }).content);
    } else {
      setPopOverContent(passwordComplexityValidator({ password: pw, user }).content);
    }
  };

  const user = getUser();

  const handleOk = async () => {
    setLoading(true);
    let validForm = true;
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    if (validForm) {
      const values = form.getFieldsValue();

      try {
        await usersService.changePassword({ id: user.id, values });
        handleSuccess('Password changed successfully');
        setChangePasswordModalVisible(false);
        form.resetFields();
      } catch (err) {
        // Error handled by axios interceptor
      }
    }
    setLoading(false);
  };

  const handleCancel = () => setChangePasswordModalVisible(false);

  useEffect(() => {}, [popOverContent]);

  return (
    <Modal
      title="Change Password"
      open={changePasswordModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={
        <>
          <Button key="cancel" onClick={handleCancel} disabled={!!loading}>
            Cancel
          </Button>

          <Button key="modify" type="primary" onClick={() => handleOk()} disabled={!!loading}>
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
                validator(_: any, value: string) {
                  if (!value) return Promise.reject();
                  if (form.getFieldValue('currentPassword') === value)
                    return Promise.reject(new Error('New password cannot be the same as the current password!'));

                  let result;
                  if (finishedTypingRef.current) {
                    result = passwordComplexityValidator({ password: value, user, oldPasswordCheck: true });
                  } else {
                    result = passwordComplexityValidator({ password: value, user });
                  }

                  finishedTypingRef.current = false;

                  if (!value || result.errors.length === 1) return Promise.resolve();
                  return Promise.reject(new Error('Password does not meet complexity requirements!'));
                },
              }),
            ]}>
            <Input.Password
              size="large"
              autoComplete="new-password"
              onChange={e => validatePassword(e.target.value)}
              onFocus={e => validatePassword(e.target.value, true)}
              onBlur={e => validatePassword(e.target.value, true)}
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
              validator(_: any, value: string) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
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
