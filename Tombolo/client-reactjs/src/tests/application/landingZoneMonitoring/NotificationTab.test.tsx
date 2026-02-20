/* eslint-disable */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Form, FormInstance } from 'antd';

vi.mock('@/components/common/Monitoring/NotificationContacts', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="notification-contacts">{children}</div>,
}));

import NotificationTab from '@/components/application/LandingZoneMonitoring/AddEditModal/NotificationTab';

describe('LandingZoneMonitoring NotificationTab', () => {
  it('renders NotificationContacts with provided form', () => {
    const Wrapper: React.FC = () => {
      const [form] = Form.useForm();
      return <NotificationTab form={form as FormInstance} />;
    };

    render(<Wrapper />);
    expect(screen.getByLabelText('Notify on')).toBeInTheDocument();
  });
});
