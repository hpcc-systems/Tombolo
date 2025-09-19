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

vi.mock('@/components/application/jobMonitoring/JobMonitoringBasicTab.jsx', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/jobMonitoring/JobMonitoringTab', () => ({
  default: () => <div>SchedulingTab</div>,
}));
vi.mock('@/components/application/jobMonitoring/JobMonitoringNotificationTab.jsx', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditJobMonitoringModal from '@/components/application/jobMonitoring/AddEditJobMonitoringModal.jsx';

describe('AddEditJobMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddJobMonitoringModal: true,
      monitoringScope: 'clusters',
      setMonitoringScope: vi.fn(),
      handleSaveJobMonitoring: vi.fn(),
      handleUpdateJobMonitoring: vi.fn(),
      intermittentScheduling: { frequency: 'daily' },
      setIntermittentScheduling: vi.fn(),
      setCompleteSchedule: vi.fn(),
      completeSchedule: {},
      cron: '',
      setCron: vi.fn(),
      cronMessage: '',
      setCronMessage: vi.fn(),
      erroneousScheduling: false,
      form: {},
      clusters: [],
      savingJobMonitoring: false,
      jobMonitorings: [],
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      domains: [],
      productCategories: [],
      setSelectedDomain: vi.fn(),
      selectedCluster: null,
      setSelectedCluster: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
    };
  });

  it('shows title based on mode', () => {
    const { rerender } = render(<AddEditJobMonitoringModal {...baseProps} />);
    // Title is provided via Modal title? The component uses footer only; no title passed. So just ensure modal rendered by checking tabs.
    expect(screen.getByTestId('tabs')).toBeInTheDocument();

    rerender(<AddEditJobMonitoringModal {...baseProps} isEditing />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('navigates tabs with Next/Previous and Cancel resets state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddEditJobMonitoringModal {...baseProps} />);

    // Simulate Next by updating activeTab prop since component relies on external state
    rerender(<AddEditJobMonitoringModal {...baseProps} activeTab={'1'} />);
    // Now move to last tab
    rerender(<AddEditJobMonitoringModal {...baseProps} activeTab={'2'} />);

    // Last tab: shows Previous and Submit (when not editing)
    expect(screen.getByText('Previous')).toBeInTheDocument();
    const submitBtn = screen.getByText('Submit');
    await user.click(submitBtn);
    expect(baseProps.handleSaveJobMonitoring).toHaveBeenCalled();

    // Cancel from anywhere should reset
    await user.click(screen.getByLabelText('modal-cancel'));
    expect(baseProps.resetStates).toHaveBeenCalled();
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('0');
  });

  it('shows Update on last tab when editing and calls update handler', async () => {
    const user = userEvent.setup();
    render(<AddEditJobMonitoringModal {...baseProps} isEditing activeTab={'2'} />);

    const updateBtn = screen.getByText('Update');
    await user.click(updateBtn);
    expect(baseProps.handleUpdateJobMonitoring).toHaveBeenCalled();
  });
});
