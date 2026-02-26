import React from 'react';
import NotificationContacts from '../../../common/Monitoring/NotificationContacts';
import { Form, FormInstance } from 'antd';

interface NotificationTabProps {
  form: FormInstance;
}

function NotificationTab({ form }: NotificationTabProps) {
  return (
    <Form form={form} layout="vertical">
      <NotificationContacts />
    </Form>
  );
}

export default NotificationTab;
