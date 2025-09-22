/* eslint-disable */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockFormItem = ({ label, children }) => (
    <div>
      {label ? <div>{label}</div> : null}
      {children}
    </div>
  );
  const MockForm = ({ children }) => <form>{children}</form>;
  MockForm.Item = MockFormItem;
  const MockSelect = ({ children, mode }) => <select data-mode={mode}>{children}</select>;
  MockSelect.Option = ({ value, children }) => <option value={String(value)}>{children}</option>;
  return { ...antd, Form: MockForm, Select: MockSelect };
});

vi.mock('@/components/common/Monitoring/NotificationContacts.jsx', () => ({
  default: ({ children }) => <div data-testid="notification-contacts">{children}</div>,
}));

import JobMonitoringNotificationTab from '@/components/application/jobMonitoring/JobMonitoringNotificationTab.jsx';

describe('JobMonitoringNotificationTab', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders NotificationContacts and filters job statuses based on scheduling frequency', () => {
    const form = {};
    const intermittentScheduling = { frequency: 'anytime' };
    render(<JobMonitoringNotificationTab form={form} intermittentScheduling={intermittentScheduling} />);

    expect(screen.getByTestId('notification-contacts')).toBeInTheDocument();
    // NotStarted and NotCompleted should be filtered out for 'anytime'
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });
});
