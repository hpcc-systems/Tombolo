import React, { useState } from 'react';
import { Button, message, Form } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import RequestAccessModal from './requestAccessModal';

const NoAccess = () => {
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);

  const onSubmit = async (values) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
      message.error('User not found');
      return;
    }

    values.id = user.id;
    values.roles = user.roles;
    values.applications = user.applications;
    const response = await fetch('/api/requestAccess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: user.token,
      },
      body: JSON.stringify(values),
    });
    console.log(response);

    if (!response.ok) {
      message.error('Failed to request access');
      return;
    }

    message.success('A request has been sent to your administration team to grant you access');
    setIsOpen(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '70%',
        margin: '0 auto',
        marginTop: '3rem',
        color: '#001529',
      }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RequestAccessModal form={form} isOpen={isOpen} onSubmit={onSubmit} setIsOpen={setIsOpen} />
        <LockOutlined style={{ fontSize: '20rem' }} />
        <div style={{ marginLeft: '3rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>403</h1>
          <p style={{ fontSize: '1rem' }}>
            You do not currently have any assigned Roles or Applications. Both are required to access Tombolo.
          </p>
          <Button size="large" type="primary" onClick={() => setIsOpen(true)}>
            Request Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
