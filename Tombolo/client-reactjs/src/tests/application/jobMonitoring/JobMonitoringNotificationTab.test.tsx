import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async importOriginal => {
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
  return { ...(antd as any), Form: MockForm, Select: MockSelect };
});

vi.mock('@/components/common/Monitoring/NotificationContacts', async () => {
  const { notificationContactsMockModule } = await import('@/tests/application/testUtils/notificationContactsMock');
  return notificationContactsMockModule;
});

import type { FormInstance } from 'antd';
import JobMonitoringNotificationTab from '@/components/application/jobMonitoring/JobMonitoringNotificationTab';

describe('JobMonitoringNotificationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders NotificationContacts and filters job statuses based on scheduling frequency', () => {
    const form = {};
    const { rerender } = render(
      <JobMonitoringNotificationTab
        form={form as unknown as FormInstance}
        intermittentScheduling={{ frequency: 'anytime' }}
      />
    );

    expect(screen.getByTestId('notification-contacts')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByText('Not started on time')).not.toBeInTheDocument();
    expect(screen.queryByText('Not completed on time')).not.toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    rerender(
      <JobMonitoringNotificationTab
        form={form as unknown as FormInstance}
        intermittentScheduling={{ frequency: 'daily' }}
      />
    );

    expect(screen.getByText('Not started on time')).toBeInTheDocument();
    expect(screen.getByText('Not completed on time')).toBeInTheDocument();
  });
});
