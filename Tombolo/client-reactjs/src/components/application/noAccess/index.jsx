// Imports from libraries
import React, { useState } from 'react';
import { Button, Form, Space } from 'antd';
import { LockOutlined, ReloadOutlined } from '@ant-design/icons';

// Local imports
import RequestAccessModal from './requestAccessModal';
import { getUser, setUser } from '../../common/userStorage';
import { handleError, handleSuccess } from '../../common/handleResponse';
import authService from '@/services/auth.service';
import { apiClient } from '@/services/api';
import styles from './noAccess.module.css';

const NoAccess = () => {
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const onSubmit = async () => {
    let values = form.getFieldsValue();
    const user = getUser();

    if (!user) {
      handleError('User not found');
      return;
    }

    values.id = user.id;
    values.roles = user.roles;
    values.applications = user.applications;
    if (!values.comment) {
      values.comment = 'No comment provided';
    }

    try {
      await authService.requestAccess(values);
      handleSuccess('A request has been sent to your administration team to grant you access');
      setIsOpen(false);
      form.resetFields();
    } catch (err) {
      handleError(err.messages || err.message || 'Failed to request access');
    }
  };

  const checkAccessStatus = async () => {
    setChecking(true);
    try {
      const user = getUser();
      if (!user) {
        handleError('User not found');
        return;
      }

      // Fetch latest user data from server using the /auth/me endpoint
      const response = await apiClient.get('/auth/me');
      const updatedUser = response.data;

      // Check if user now has access (roles and applications)
      if (updatedUser.roles?.length > 0 && updatedUser.applications?.length > 0) {
        // Refresh the access token to get a new JWT with updated roles in cookies
        await authService.refreshToken();

        // Update localStorage with fresh user data
        const mergedUser = {
          ...getUser(),
          ...updatedUser,
          isAuthenticated: true,
        };
        setUser(JSON.stringify(mergedUser));

        handleSuccess('Access granted! Redirecting...');
        setTimeout(() => {
          window.location.replace('/');
        }, 1000);
      } else {
        handleSuccess('Access not yet granted. Please try again later.');
      }
    } catch (err) {
      handleError(err.messages || err.message || 'Failed to check access status');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.container__child}>
        <RequestAccessModal form={form} isOpen={isOpen} onSubmit={onSubmit} setIsOpen={setIsOpen} />
        <LockOutlined className={styles.lock_icon} />
        <div className={styles.noAccess_info}>
          <h1>403</h1>
          <p>You do not currently have any assigned Roles or Applications. Both are required to access Tombolo.</p>
          <Space size="middle">
            <Button size="large" type="primary" onClick={() => setIsOpen(true)}>
              Request Access
            </Button>
            <Button size="large" icon={<ReloadOutlined />} loading={checking} onClick={checkAccessStatus}>
              Check Access Status
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
