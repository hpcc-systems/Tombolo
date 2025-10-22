// Imports from libraries
import React, { useState } from 'react';
import { Button, Form } from 'antd';
import { LockOutlined } from '@ant-design/icons';

// Local imports
import RequestAccessModal from './requestAccessModal';
import { getUser } from '../../common/userStorage';
import { handleError, handleSuccess } from '../../common/handleResponse';
import authService from '@/services/auth.service';
import styles from './noAccess.module.css';

const NoAccess = () => {
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);

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
      // Error handled by axios interceptor
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
          <Button size="large" type="primary" onClick={() => setIsOpen(true)}>
            Request Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
