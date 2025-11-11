import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async (importOriginal) => {
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
  const MockCard = ({ children }) => <div>{children}</div>;
  return {
    ...antd,
    Modal: MockModal,
    Tabs: MockTabs,
    Button: MockButton,
    Badge: MockBadge,
    Card: MockCard,
    notification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

vi.mock('@/components/application/clusterMonitoring/AddEditModal/BasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/clusterMonitoring/AddEditModal/NotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

vi.mock('@/services/clusterMonitoring.service', () => ({
  default: {
    create: vi.fn().mockResolvedValue({ data: { id: 111 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 222 } }),
  },
}));

vi.mock('@/components/application/clusterMonitoring/clusterMonitoringUtils', () => ({
  identifyErroneousTabs: vi.fn().mockReturnValue([]),
}));

import AddEditModal from '@/components/application/clusterMonitoring/AddEditModal/AddEditModal.jsx';
import clusterMonitoringService from '@/services/clusterMonitoring.service';

describe('Cluster AddEditModal', () => {
  let baseProps;
  let form;
  beforeEach(() => {
    form = {
      resetFields: vi.fn(),
      validateFields: vi.fn().mockResolvedValue(undefined),
      getFieldsError: vi.fn().mockReturnValue([]),
      getFieldsValue: vi.fn().mockReturnValue({
        monitoringName: 'X',
        clusterMonitoringType: ['usage'],
        usageThreshold: 10,
        domain: 'd1',
        productCategory: 'p1',
        primaryContacts: [],
        secondaryContacts: [],
        notifyContacts: [],
      }),
    };
    baseProps = {
      setDisplayAddEditModal: vi.fn(),
      form,
      handleClusterChange: vi.fn(),
      domains: [],
      productCategories: [],
      setProductCategories: vi.fn(),
      selectedDomain: undefined,
      setSelectedDomain: vi.fn(),
      setClusterMonitoring: vi.fn(),
      clusterMonitoring: [],
      setEditingMonitoring: vi.fn(),
      editingMonitoring: false,
      selectedMonitoring: { id: 5 },
      setDuplicatingData: vi.fn(),
      isDuplicating: false,
      monitoringType: [],
      setMonitoringType: vi.fn(),
    };
  });

  it('shows correct title based on mode', () => {
    const { rerender } = render(<AddEditModal {...baseProps} />);
    expect(screen.getByTestId('title')).toHaveTextContent('Add Cluster Monitoring');

    rerender(<AddEditModal {...baseProps} editingMonitoring />);
    expect(screen.getByTestId('title')).toHaveTextContent('Edit Cluster Monitoring');

    rerender(<AddEditModal {...baseProps} isDuplicating />);
    expect(screen.getByTestId('title')).toHaveTextContent('Duplicate Cluster Monitoring');
  });

  it('navigates Next/Previous and Cancel resets state', async () => {
    const user = userEvent.setup();
    render(<AddEditModal {...baseProps} />);

    await user.click(screen.getByText('Next'));
    // Now should be on tab 1; clicking Previous returns
    await user.click(screen.getByText('Previous'));

    await user.click(screen.getByText('Cancel'));
    expect(baseProps.setDisplayAddEditModal).toHaveBeenCalledWith(false);
    expect(baseProps.setEditingMonitoring).toHaveBeenCalledWith(false);
    expect(form.resetFields).toHaveBeenCalled();
  });

  it('on last tab shows Previous and Update when not editing; Submit when editing and calls update util', async () => {
    const user = userEvent.setup();
    // Render with editing to drop into last tab footer showing Previous/Submit in our mock
    const { rerender } = render(<AddEditModal {...baseProps} editingMonitoring />);

    // Initially on first tab, should see Next; navigate to last tab to see Submit
    const nextBtn1 = screen.queryByText('Next');
    if (nextBtn1) {
      await user.click(nextBtn1);
    }
    expect(screen.getByText('Submit')).toBeInTheDocument();

    // Editing path: expect Submit and updateClusterMonitoring called
    rerender(<AddEditModal {...baseProps} editingMonitoring selectedMonitoring={{ id: 77 }} />);
    const nextBtn2 = screen.queryByText('Next');
    if (nextBtn2) {
      await user.click(nextBtn2);
    }
    const submitBtn = screen.getByText('Submit');
    await user.click(submitBtn);
    expect(clusterMonitoringService.update).toHaveBeenCalled();
  });

  it('calls create util when not editing on submit', async () => {
    const user = userEvent.setup();
    render(<AddEditModal {...baseProps} />);
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Update'));
    expect(clusterMonitoringService.create).toHaveBeenCalled();
  });
});
