import React, { useState } from 'react';
import { Button, message, Form } from 'antd';
import { handleError } from '../../common/AuthHeader';
import { LockOutlined } from '@ant-design/icons';
import RequestAccessModal from './requestAccessModal';
import { getUser } from '../../common/userStorage';

import styles from './noAccess.module.css';

const NoAccess = () => {
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);

  const onSubmit = async () => {
    let values = form.getFieldsValue();
    const user = getUser();

    if (!user) {
      message.error('User not found');
      return;
    }

    values.id = user.id;
    values.roles = user.roles;
    values.applications = user.applications;
    if (!values.comment) {
      values.comment = 'No comment provided';
    }

    const response = await fetch('/api/auth/requestAccess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });
    console.log(response);

    if (!response.ok) {
      handleError(response);
      return;
    }

    message.success('A request has been sent to your administration team to grant you access');
    setIsOpen(false);
    form.resetFields();
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
