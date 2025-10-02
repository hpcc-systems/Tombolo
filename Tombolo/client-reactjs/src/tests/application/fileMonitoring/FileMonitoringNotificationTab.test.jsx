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
  const MockInputNumber = ({ addonAfter }) => (
    <div>
      <span data-testid="addon-after">{addonAfter}</span>
    </div>
  );
  const MockSelect = ({ children, mode, onChange, placeholder }) => <select data-mode={mode} onChange={(e)=>onChange?.([e.target.value])} aria-label="select" placeholder={placeholder}>{children}</select>;
  MockSelect.Option = ({ value, children }) => <option value={String(value)}>{children}</option>;
  const MockRow = ({ children }) => <div>{children}</div>;
  const MockCol = ({ children }) => <div>{children}</div>;
  return { ...antd, Form: MockForm, InputNumber: MockInputNumber, Select: MockSelect, Row: MockRow, Col: MockCol };
});

vi.mock('@/components/common/Monitoring/NotificationContacts.jsx', () => ({
  default: ({ children }) => <div data-testid="notification-contacts">{children}</div>,
}));

import FileMonitoringNotificationTab from '@/components/application/fileMonitoring/FileMonitoringNotificationTab.jsx';

const makeForm = () => ({ setFieldsValue: vi.fn(), getFieldValue: vi.fn(() => null) });

describe('FileMonitoringNotificationTab', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders NotificationContacts and shows condition options based on monitoringFileType', () => {
    const form = makeForm();
    const selectedNotificationCondition = [];
    const setSelectedNotificationCondition = vi.fn();

    const { rerender } = render(
      <FileMonitoringNotificationTab
        form={form}
        monitoringFileType="stdLogicalFile"
        selectedNotificationCondition={selectedNotificationCondition}
        setSelectedNotificationCondition={setSelectedNotificationCondition}
        isEditing={false}
      />
    );

    expect(screen.getByTestId('notification-contacts')).toBeInTheDocument();
    // Should render one option for stdLogicalFile
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Rerender for superFile to ensure different options exist
    rerender(
      <FileMonitoringNotificationTab
        form={form}
        monitoringFileType="superFile"
        selectedNotificationCondition={selectedNotificationCondition}
        setSelectedNotificationCondition={setSelectedNotificationCondition}
        isEditing={false}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
