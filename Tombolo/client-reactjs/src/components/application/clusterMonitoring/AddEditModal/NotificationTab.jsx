import React from 'react';
import NotificationContacts from '../../../common/Monitoring/NotificationContacts';
import { Form } from 'antd';

function NotificationTab({ form }) {
  return (
    <Form form={form} layout="vertical">
      <NotificationContacts />
    </Form>
  );
}

export default NotificationTab;
