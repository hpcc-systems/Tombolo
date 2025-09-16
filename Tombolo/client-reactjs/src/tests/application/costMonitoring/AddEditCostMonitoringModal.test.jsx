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

// Stub child tabs
vi.mock('@/components/application/costMonitoring/CostMonitoringBasicTab.jsx', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/costMonitoring/CostMonitoringNotificationTab.jsx', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditCostMonitoringModal from '@/components/application/costMonitoring/AddEditCostMonitoringModal.jsx';

describe('AddEditCostMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddCostMonitoringModal: true,
      handleSaveCostMonitoring: vi.fn(),
      handleUpdateCostMonitoring: vi.fn(),
      form: {},
      clusters: [],
      savingCostMonitoring: false,
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      setErroneousTabs: vi.fn(),
      handleClusterChange: vi.fn(),
      costMonitorings: [],
      domains: [],
      productCategories: [],
      selectedClusters: [],
      setSelectedDomain: vi.fn(),
    };
  });

  it('shows correct title based on mode', () => {
    const { rerender } = render(<AddEditCostMonitoringModal {...baseProps} />);
    expect(screen.getByTestId('title')).toHaveTextContent('Add Cost Monitoring');

    rerender(<AddEditCostMonitoringModal {...baseProps} isEditing />);
    expect(screen.getByTestId('title')).toHaveTextContent('Edit Cost Monitoring');

    rerender(<AddEditCostMonitoringModal {...baseProps} isDuplicating />);
    expect(screen.getByTestId('title')).toHaveTextContent('Duplicate Cost Monitoring');
  });

  it('renders Next/Cancel on first tab and navigates on Next; Cancel resets', async () => {
    const user = userEvent.setup();
    render(<AddEditCostMonitoringModal {...baseProps} />);

    // First tab footer includes Next and Cancel
    await user.click(screen.getByText('Next'));
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('1');

    await user.click(screen.getByText('Cancel'));
    expect(baseProps.resetStates).toHaveBeenCalled();
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('0');
  });

  it('renders Previous and Submit on last tab when not editing; shows Update when editing', async () => {
    const user = userEvent.setup();
    const props = { ...baseProps, activeTab: '1' }; // last tab (two tabs: keys 0 and 1)
    const { rerender } = render(<AddEditCostMonitoringModal {...props} />);

    // Has Previous and Submit
    expect(screen.getByText('Previous')).toBeInTheDocument();
    const submitBtn = screen.getByText('Submit');
    await user.click(submitBtn);
    expect(baseProps.handleSaveCostMonitoring).toHaveBeenCalled();

    // Editing path shows Update
    rerender(<AddEditCostMonitoringModal {...props} isEditing />);
    const updateBtn = screen.getByText('Update');
    await user.click(updateBtn);
    expect(baseProps.handleUpdateCostMonitoring).toHaveBeenCalled();
  });
});
