/* eslint-disable */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/common/Monitoring/NotificationContacts.jsx', () => ({
  default: ({ children }) => <div data-testid="notification-contacts">{children}</div>,
}));

import NotificationTab from '@/components/application/clusterMonitoring/AddEditModal/NotificationTab.jsx';

describe('ClusterMonitoring NotificationTab', () => {
  it('renders NotificationContacts with provided form', () => {
    const form = {};
    render(<NotificationTab form={form} />);
    expect(screen.getByTestId('notification-contacts')).toBeInTheDocument();
  });
});
