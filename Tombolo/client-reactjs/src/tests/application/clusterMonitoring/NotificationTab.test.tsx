/* eslint-disable */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Form, FormInstance } from 'antd';

vi.mock('@/components/common/Monitoring/NotificationContacts', () => ({
  default: (props: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'notification-contacts' }, props.children),
}));

import NotificationTab from '@/components/application/clusterMonitoring/AddEditModal/NotificationTab';

describe('ClusterMonitoring NotificationTab', () => {
  it('renders NotificationContacts with provided form', () => {
    const Wrapper: React.FC = () => {
      const [form] = Form.useForm();
      return <NotificationTab form={form as FormInstance} />;
    };

    render(<Wrapper />);
    expect(screen.getByTestId('notification-contacts')).toBeInTheDocument();
  });
});
