import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApproveRejectModal from '@/components/common/Monitoring/ApproveRejectModal.jsx';

// Mock rc-component/portal to avoid portal DOM selector logic in tests
vi.mock('@rc-component/portal', () => ({
  default: ({ children }) => <>{children}</>,
}));

// Mock antd message API to avoid real DOM side effects and to assert calls
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockModal = ({ open, title, children, footer }) => {
    if (!open) return null;
    return (
      <div data-testid="mock-modal">
        {title ? <div>{title}</div> : null}
        <div>{children}</div>
        {footer ? <div>{footer}</div> : null}
      </div>
    );
  };
  const MockSelect = ({ value, onChange, children, placeholder }) => (
    <select aria-label="Action" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
      <option value="" disabled>
        {placeholder || 'Select'}
      </option>
      {children}
    </select>
  );
  function MockOption({ value, children }) {
    return <option value={value}>{children}</option>;
  }
  MockOption.displayName = 'Select.Option';
  MockSelect.Option = MockOption;

  return {
    ...antd,
    Modal: MockModal,
    Select: MockSelect,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
      destroy: vi.fn(),
      config: vi.fn(),
    },
  };
});
import { message } from 'antd';
import { handleSuccess } from '@/utils/handleResponse';

// Helper to render modal with getContainer={false} to keep it in the RTL container
const setup = (props = {}) => {
  const defaultProps = {
    visible: true,
    onCancel: vi.fn(),
    selectedMonitoring: null,
    setSelectedMonitoring: vi.fn(),
    selectedRows: [],
    setMonitoring: vi.fn(),
    evaluateMonitoring: vi.fn(),
    monitoringTypeLabel: 'Monitoring',
    // Render Modal inside JSDOM body to avoid portal selector issues
    getContainer: () => document.body,
  };
  const allProps = { ...defaultProps, ...props };
  // Pass modalProps along with spread in component props
  return {
    user: userEvent.setup(),
    ...render(<ApproveRejectModal {...allProps} />),
    props: allProps,
  };
};

const APPROVED = 'approved';
const REJECTED = 'rejected';

describe('ApproveRejectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title for single and bulk modes', () => {
    const { rerender } = render(
      <ApproveRejectModal
        visible
        onCancel={() => {}}
        setSelectedMonitoring={() => {}}
        setMonitoring={() => {}}
        evaluateMonitoring={() => {}}
        getContainer={() => document.body}
      />
    );
    expect(screen.getByText('Approve/Reject Monitoring')).toBeInTheDocument();

    rerender(
      <ApproveRejectModal
        visible
        onCancel={() => {}}
        setSelectedMonitoring={() => {}}
        setMonitoring={() => {}}
        evaluateMonitoring={() => {}}
        selectedRows={[{ id: 1 }]}
        getContainer={() => document.body}
      />
    );
    expect(screen.getByText('Bulk Approve/Reject Monitoring')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const { user, props } = setup();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(props.evaluateMonitoring).not.toHaveBeenCalled();

    // AntD Form shows specific messages from rules
    expect(await screen.findByText('Please select an action')).toBeInTheDocument();
    expect(await screen.findByText('Please enter comments')).toBeInTheDocument();
  });

  it('submits approve action with isActive true by default', async () => {
    const evaluateMonitoring = vi.fn().mockResolvedValue({ data: { id: 10 }, message: 'ok' });
    const setMonitoring = vi.fn();
    const onCancel = vi.fn();

    const { user } = setup({ evaluateMonitoring, setMonitoring, onCancel, selectedMonitoring: { id: 10 } });

    // open Select and choose Approve
    const actionSelect = screen.getByLabelText('Action');
    await user.selectOptions(actionSelect, 'approved');

    // comment input
    const comments = screen.getByPlaceholderText('Comments');
    await user.type(comments, 'Looks good');

    // checkbox should be enabled and checked by default
    const checkbox = screen.getByRole('checkbox', { name: /start monitoring/i });
    expect(checkbox).toBeEnabled();
    expect(checkbox).toBeChecked();

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(evaluateMonitoring).toHaveBeenCalled());
    const payload = evaluateMonitoring.mock.calls[0][0];
    expect(payload).toMatchObject({
      approvalStatus: APPROVED,
      approverComment: 'Looks good',
      isActive: true,
      ids: [10],
    });

    await waitFor(() => expect(handleSuccess).toHaveBeenCalled());
    expect(onCancel).toHaveBeenCalled();
  });

  it('forces isActive false and disables checkbox when Reject is selected', async () => {
    const evaluateMonitoring = vi.fn().mockResolvedValue({ data: { id: 21 }, message: 'saved' });
    const onCancel = vi.fn();

    const { user } = setup({ evaluateMonitoring, onCancel, selectedMonitoring: { id: 21 } });

    // choose Reject
    const actionSelect = screen.getByLabelText('Action');
    await user.selectOptions(actionSelect, 'rejected');

    // Checkbox should be disabled once rejected
    const checkbox = screen.getByRole('checkbox', { name: /start monitoring/i });
    expect(checkbox).toBeDisabled();

    // comments
    await user.type(screen.getByPlaceholderText('Comments'), 'Not acceptable');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(evaluateMonitoring).toHaveBeenCalled());
    const payload = evaluateMonitoring.mock.calls[0][0];
    expect(payload.approvalStatus).toBe(REJECTED);
    expect(payload.isActive).toBe(false);

    await waitFor(() => expect(handleSuccess).toHaveBeenCalled());
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles array response from evaluateMonitoring by updating setMonitoring and selectedMonitoring', async () => {
    const updated = [{ id: 1, approvalStatus: APPROVED }];
    const evaluateMonitoring = vi.fn().mockResolvedValue({ data: updated, message: 'updated' });
    const setMonitoring = vi.fn((updater) => {
      // simulate updater call with prev
      const prev = [{ id: 1, approvalStatus: 'pending' }];
      updater(prev);
    });
    const setSelectedMonitoring = vi.fn();
    const onCancel = vi.fn();

    const { user } = setup({
      evaluateMonitoring,
      setMonitoring,
      setSelectedMonitoring,
      onCancel,
      selectedMonitoring: { id: 1 },
    });

    // Approve path
    const actionSelect = screen.getByLabelText('Action');
    await user.selectOptions(actionSelect, 'approved');
    await user.type(screen.getByPlaceholderText('Comments'), 'All good');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(evaluateMonitoring).toHaveBeenCalled());
    expect(setMonitoring).toHaveBeenCalled();
    // When single item selected and array of one returned, it updates selected
    expect(setSelectedMonitoring).toHaveBeenCalledWith(updated[0]);
    expect(onCancel).toHaveBeenCalled();
    expect(handleSuccess).toHaveBeenCalledWith('updated');
  });

  it('shows evaluated view and toggles back to form on Modify', async () => {
    const selectedMonitoring = {
      id: 5,
      approvalStatus: APPROVED,
      approver: { firstName: 'Jane', lastName: 'Doe', email: 'jane@doe.com' },
      approvedAt: new Date().toISOString(),
    };

    const { user } = setup({ selectedMonitoring });

    expect(screen.getByText(/This monitoring was/i)).toBeInTheDocument();

    // Footer has Modify button
    const modifyBtn = screen.getByRole('button', { name: /modify/i });
    await user.click(modifyBtn);

    // Form should be visible again
    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    expect(screen.getByLabelText('Comments')).toBeInTheDocument();
  });

  it('handles success string response and calls onSuccess then closes', async () => {
    const evaluateMonitoring = vi.fn().mockResolvedValue('Saved');
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const setSelectedMonitoring = vi.fn();

    const { user } = setup({
      evaluateMonitoring,
      onSuccess,
      onCancel,
      setSelectedMonitoring,
      selectedMonitoring: { id: 99 },
    });

    const actionSelect = screen.getByLabelText('Action');
    await user.selectOptions(actionSelect, 'approved');
    await user.type(screen.getByPlaceholderText('Comments'), 'Okay');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(evaluateMonitoring).toHaveBeenCalled());
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(setSelectedMonitoring).toHaveBeenCalledWith(null);
    expect(onCancel).toHaveBeenCalled();
    expect(handleSuccess).toHaveBeenCalled();
  });

  it('shows error when evaluateMonitoring handler is missing', async () => {
    const evaluateMonitoring = undefined;
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const setSelectedMonitoring = vi.fn();
    const { user } = setup({
      evaluateMonitoring,
      onSuccess,
      onCancel,
      setSelectedMonitoring,
      selectedMonitoring: { id: 99 },
    });

    const actionSelect = screen.getByLabelText('Action');
    await user.selectOptions(actionSelect, 'approved');
    await user.type(screen.getByPlaceholderText('Comments'), 'Okay'); // Use 4+ characters
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('No evaluation handler provided.'));
  });
});
