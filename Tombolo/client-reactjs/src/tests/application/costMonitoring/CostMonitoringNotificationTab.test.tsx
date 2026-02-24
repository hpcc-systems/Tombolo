/* eslint-disable */
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
  const MockInputNumber = ({ addonBefore, addonAfter }) => (
    <div>
      <span data-testid="addon-before">{addonBefore}</span>
      <span data-testid="addon-after">{addonAfter}</span>
    </div>
  );
  const MockSelect = ({ children }) => <select>{children}</select>;
  MockSelect.Option = ({ value, children }) => <option value={String(value)}>{children}</option>;
  return { ...(antd as any), Form: MockForm, InputNumber: MockInputNumber, Select: MockSelect };
});

// Stub NotificationContacts to simple pass-through
vi.mock('@/components/common/Monitoring/NotificationContacts', () => ({
  default: ({ children }) => <div data-testid="notification-contacts">{children}</div>,
}));

vi.mock('@/components/common/currencyCodeToSymbol', () => ({
  default: code => (code === 'EUR' ? '€' : code === 'USD' ? '$' : '$'),
}));

import type { FormInstance } from 'antd';
import CostMonitoringNotificationTab from '@/components/application/costMonitoring/CostMonitoringNotificationTab';

// Minimal form mock
const makeForm = (scope, clusterIds) => ({
  getFieldValue: name => {
    if (name === 'monitoringScope') return scope;
    if (name === 'clusterIds') return clusterIds;
    return undefined;
  },
});

const clusters = [
  { id: 'c1', currencyCode: 'EUR', name: 'Cluster One' },
  { id: 'c2', currencyCode: 'USD', name: 'Cluster Two' },
];

describe('CostMonitoringNotificationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders NotificationContacts and shows euro symbol when first selected cluster has EUR', () => {
    const form = makeForm('clusters', ['c1']);
    render(<CostMonitoringNotificationTab form={form as unknown as FormInstance} clusters={clusters} />);

    // Presence of NotificationContacts
    expect(screen.getByTestId('notification-contacts')).toBeInTheDocument();

    // Currency symbol addonBefore
    expect(screen.getByTestId('addon-before')).toHaveTextContent('€');

    // Summed dropdown for clusters scope: expects "Per cluster" and "Total"
    expect(screen.getByTestId('addon-after')).toHaveTextContent('Per cluster');
    expect(screen.getByTestId('addon-after')).toHaveTextContent('Total');
  });

  it('shows users scope labels in summed dropdown', () => {
    const form = makeForm('users', ['c2']);
    render(<CostMonitoringNotificationTab form={form as unknown as FormInstance} clusters={clusters} />);

    // Users scope renders "Per user" and "Total"
    expect(screen.getByTestId('addon-after')).toHaveTextContent('Per user');
    expect(screen.getByTestId('addon-after')).toHaveTextContent('Total');
  });
});
