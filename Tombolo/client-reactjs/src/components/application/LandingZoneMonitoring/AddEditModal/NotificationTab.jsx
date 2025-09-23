//Packages
import React from 'react';
import { Form } from 'antd';
import NotificationContacts from '../../../common/Monitoring/NotificationContacts';

function NotificationTab({ form }) {
  return (
    <Form form={form} layout="vertical">
      <NotificationContacts />
    </Form>
  );
}

export default NotificationTab;
