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

vi.mock('@/components/application/LandingZoneMonitoring/AddEditModal/BasicTab.jsx', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/LandingZoneMonitoring/AddEditModal/MonitoringTab.jsx', () => ({
  default: () => <div>MonitoringTab</div>,
}));
vi.mock('@/components/application/LandingZoneMonitoring/AddEditModal/NotificationTab.jsx', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditModal from '@/components/application/LandingZoneMonitoring/AddEditModal/Modal.jsx';

describe('LandingZone AddEditModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddEditModal: true,
      setDisplayAddEditModal: vi.fn(),
      handleSaveLzmonitoring: vi.fn(),
      handleUpdateLzMonitoring: vi.fn(),
      form: {},
      clusters: [],
      isEditing: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      selectedCluster: null,
      setSelectedCluster: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      directory: '',
      setDirectory: vi.fn(),
      copying: false,
      setCopying: vi.fn(),
      selectedMonitoring: null,
      domains: [],
      productCategories: [],
      setSelectedDomain: vi.fn(),
      lzMonitoringType: null,
      setLzMonitoringType: vi.fn(),
      landingZoneMonitoring: [],
      setMinSizeThresholdUnit: vi.fn(),
      setMaxSizeThresholdUnit: vi.fn(),
      minSizeThresholdUnit: 'MB',
      maxSizeThresholdUnit: 'MB',
    };
  });

  it('renders modal and tabs; title reflects mode', () => {
    const { rerender } = render(<AddEditModal {...baseProps} />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toHaveTextContent('Add Landing Zone Monitoring');

    rerender(<AddEditModal {...baseProps} isEditing />);
    expect(screen.getByTestId('title')).toHaveTextContent('Edit Landing Zone Monitoring');
  });

  it('navigates tabs via activeTab prop and triggers submit/update handlers', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddEditModal {...baseProps} />);

    // move to tab 1
    rerender(<AddEditModal {...baseProps} activeTab={'1'} />);
    // move to last tab 2
    rerender(<AddEditModal {...baseProps} activeTab={'2'} />);

    // On last tab, when not editing, shows Submit
    const submitBtn = screen.getByText('Submit');
    await user.click(submitBtn);
    expect(baseProps.handleSaveLzmonitoring).toHaveBeenCalled();

    // Editing shows Update
    rerender(<AddEditModal {...baseProps} isEditing activeTab={'2'} />);
    const updateBtn = screen.getByText('Update');
    await user.click(updateBtn);
    expect(baseProps.handleUpdateLzMonitoring).toHaveBeenCalled();

    // Cancel resets state
    await user.click(screen.getByLabelText('modal-cancel'));
    expect(baseProps.resetStates).toHaveBeenCalled();
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('0');
    expect(baseProps.setCopying).toHaveBeenCalledWith(false);
    expect(baseProps.setLzMonitoringType).toHaveBeenCalledWith(null);
  });
});
