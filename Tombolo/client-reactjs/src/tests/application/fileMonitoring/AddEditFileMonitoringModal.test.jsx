/* eslint-disable */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockModal = ({ open, title, footer, children, onCancel }) => (
    open ? (
      <div>
        <div data-testid="title">{title}</div>
        <div>{children}</div>
        <div>{footer}</div>
        <button aria-label="modal-cancel" onClick={onCancel}>x</button>
      </div>
    ) : null
  );
  const MockTabs = ({ items, activeKey, onChange }) => (
    <div>
      <div data-testid="tabs">
        {items.map((it) => (
          <button key={it.key} aria-label={`tab-${it.key}`} onClick={() => onChange?.(it.key)}>
            {it.label}
          </button>
        ))}
      </div>
      <div data-testid="tab-content">{items.find((i) => i.key === activeKey)?.children}</div>
    </div>
  );
  const MockButton = ({ children, onClick }) => <button onClick={onClick}>{children}</button>;
  const MockBadge = () => null;
  return { ...antd, Modal: MockModal, Tabs: MockTabs, Button: MockButton, Badge: MockBadge };
});

vi.mock('@/components/application/fileMonitoring/FileMonitoringBasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/fileMonitoring/FileMonitoringNotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditFileMonitoringModal from '@/components/application/fileMonitoring/AddEditFileMonitoringModal.jsx';

describe('AddEditFileMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddFileMonitoringModal: true,
      handleSaveFileMonitoring: vi.fn(),
      handleUpdateFileMonitoring: vi.fn(),
      form: { setFieldsValue: vi.fn() },
      clusters: [],
      savingFileMonitoring: false,
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      setErroneousTabs: vi.fn(),
      handleClusterChange: vi.fn(),
      fileMonitoring: [],
      domains: [],
      productCategories: [],
      selectedClusters: [],
      setSelectedDomain: vi.fn(),
      selectedNotificationCondition: [],
      setSelectedNotificationCondition: vi.fn(),
      monitoringFileType: 'stdLogicalFile',
      setMonitoringFileType: vi.fn(),
    };
  });

  it('renders modal and allows navigation; Cancel resets state', async () => {
    const user = userEvent.setup();
    render(<AddEditFileMonitoringModal {...baseProps} />);

    // First tab footer has Next and Cancel
    await user.click(screen.getByText('Next'));
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('1');

    // Cancel
    await user.click(screen.getByText('Cancel'));
    expect(baseProps.resetStates).toHaveBeenCalled();
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('0');
  });

  it('shows Submit on last tab when not editing; Update when editing', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddEditFileMonitoringModal {...baseProps} activeTab={'1'} />);

    // Last tab
    expect(screen.getByText('Previous')).toBeInTheDocument();
    const submitBtn = screen.getByText('Submit');
    await user.click(submitBtn);
    expect(baseProps.handleSaveFileMonitoring).toHaveBeenCalled();

    // Editing mode
    rerender(<AddEditFileMonitoringModal {...baseProps} isEditing activeTab={'1'} />);
    const updateBtn = screen.getByText('Update');
    await user.click(updateBtn);
    expect(baseProps.handleUpdateFileMonitoring).toHaveBeenCalled();
  });
});
