/* eslint-disable */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async importOriginal => {
  const antd = await importOriginal();
  const MockModal = ({ open, title, footer, children, onCancel }) =>
    open ? (
      <div>
        <div data-testid="title">{title}</div>
        <div>{children}</div>
        <div>{footer}</div>
        <button aria-label="modal-cancel" onClick={onCancel}>
          x
        </button>
      </div>
    ) : null;
  const MockTabs = ({ items, activeKey, onChange }) => (
    <div>
      <div data-testid="tabs">
        {items.map(it => (
          <button key={it.key} aria-label={`tab-${it.key}`} onClick={() => onChange?.(it.key)}>
            {it.label}
          </button>
        ))}
      </div>
      <div data-testid="tab-content">{items.find(i => i.key === activeKey)?.children}</div>
    </div>
  );
  const MockButton = ({ children, onClick }) => <button onClick={onClick}>{children}</button>;
  const MockBadge = () => null;
  return { ...antd, Modal: MockModal, Tabs: MockTabs, Button: MockButton, Badge: MockBadge };
});

// Stub child tabs
vi.mock('@/components/application/orbitProfileMonitoring/AddEditModal/BasicTab.jsx', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/orbitProfileMonitoring/AddEditModal/AsrTab.jsx', () => ({
  default: () => <div>AsrTab</div>,
}));
vi.mock('@/components/application/orbitProfileMonitoring/AddEditModal/NotificationTab.jsx', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditModal from '@/components/application/orbitProfileMonitoring/AddEditModal/Modal.jsx';

describe('AddEditOrbitMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddEditModal: true,
      saveOrbitMonitoring: vi.fn(),
      form: {
        validateFields: vi.fn().mockResolvedValue(),
        getFieldsValue: vi.fn().mockReturnValue({}),
        setFieldsValue: vi.fn(),
        setFields: vi.fn(),
        resetFields: vi.fn(),
      },
      savingOrbitMonitoring: false,
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      setErroneousTabs: vi.fn(),
      setDisplayAddEditModal: vi.fn(),
      orbitMonitoringData: [],
      domains: [],
      productCategories: [],
      setSelectedDomain: vi.fn(),
      selectedMonitoring: null,
      applicationId: 'app-1',
      selectedDomain: null,
    };
  });

  it('shows correct title based on mode', () => {
    const { rerender } = render(<AddEditModal {...baseProps} />);
    expect(screen.getByTestId('title')).toHaveTextContent('Add Orbit Monitoring');

    rerender(<AddEditModal {...baseProps} isEditing />);
    expect(screen.getByTestId('title')).toHaveTextContent('Edit Orbit Monitoring');

    rerender(<AddEditModal {...baseProps} isDuplicating />);
    expect(screen.getByTestId('title')).toHaveTextContent('Duplicate Orbit Monitoring');
  });

  it('renders Next/Cancel on first tab and navigates on Next; Cancel resets', async () => {
    const user = userEvent.setup();
    render(<AddEditModal {...baseProps} />);

    // First tab footer includes Next and Cancel
    await user.click(screen.getByText('Next'));
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('1');

    await user.click(screen.getByText('Cancel'));
    expect(baseProps.resetStates).toHaveBeenCalled();
  });

  it('renders Previous and Save on last tab when not editing; shows Update when editing', async () => {
    const user = userEvent.setup();
    const props = { ...baseProps, activeTab: '2' }; // last tab (three tabs: keys 0, 1, 2)
    const { rerender } = render(<AddEditModal {...props} />);

    // Has Previous and Save
    expect(screen.getByText('Previous')).toBeInTheDocument();
    const saveBtn = screen.getByText('Save');
    await user.click(saveBtn);
    expect(baseProps.saveOrbitMonitoring).toHaveBeenCalled();

    // Editing path shows Update
    rerender(<AddEditModal {...props} isEditing />);
    const updateBtn = screen.getByText('Update');
    await user.click(updateBtn);
    expect(baseProps.saveOrbitMonitoring).toHaveBeenCalled();
  });
});
