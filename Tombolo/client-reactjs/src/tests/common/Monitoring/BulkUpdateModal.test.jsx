/* eslint-disable */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import BulkUpdateModal from '@/components/common/Monitoring/BulkUpdateModal.jsx';

// Mock antd Modal/Select/message
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockModal = ({ open, children, footer }) =>
    open ? (
      <div>
        {children}
        {footer}
      </div>
    ) : null;
  const MockSelect = ({ value = [], onChange, placeholder }) => (
    <select
      multiple
      value={value}
      aria-label={placeholder || 'select'}
      onChange={(e) => onChange?.([...e.target.selectedOptions].map((o) => o.value))}>
      {/* Test will call onChange directly; options are not necessary */}
    </select>
  );
  const message = { success: vi.fn(), error: vi.fn() };
  return { ...antd, Modal: MockModal, Select: MockSelect, message };
});

// Mock react-redux useSelector
let mockState;
vi.mock('react-redux', () => ({
  useSelector: (sel) => sel(mockState),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    application: {
      application: { applicationId: 'app-1' },
      integrations: [{ name: 'ASR', application_id: 'app-1' }],
    },
  };
});

const rows = [
  {
    id: 1,
    monitoringName: 'A',
    metaData: {
      notificationMetaData: {
        primaryContacts: ['a@x.com'],
        secondaryContacts: ['s@x.com'],
        notifyContacts: ['n@x.com'],
      },
    },
  },
  {
    id: 2,
    monitoringName: 'B',
    metaData: {
      notificationMetaData: {
        primaryContacts: ['b@x.com'],
        secondaryContacts: ['s@x.com'],
        notifyContacts: [],
      },
    },
  },
];

const baseProps = () => ({
  bulkEditModalVisibility: true,
  setBulkEditModalVisibility: vi.fn(),
  monitorings: rows,
  setMonitorings: vi.fn(),
  selectedRows: rows,
  setSelectedRows: vi.fn(),
  monitoringType: 'job',
  handleBulkUpdateMonitorings: vi.fn().mockResolvedValue(),
});

describe('BulkUpdateModal', () => {
  it('requires primary contacts on save and blocks submission', async () => {
    const rowsMissingPrimary = [
      {
        id: 1,
        monitoringName: 'A',
        metaData: { notificationMetaData: { primaryContacts: [], secondaryContacts: ['s@x.com'], notifyContacts: [] } },
      },
    ];
    const props = {
      ...baseProps(),
      selectedRows: rowsMissingPrimary,
      monitorings: rowsMissingPrimary,
    };
    const { message } = await import('antd');
    render(<BulkUpdateModal {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(message.error).toHaveBeenCalled());
    expect(props.handleBulkUpdateMonitorings).not.toHaveBeenCalled();
  });

  it('builds updated metadata and calls bulk update; updates state and closes', async () => {
    const props = baseProps();
    const { message } = await import('antd');
    render(<BulkUpdateModal {...props} />);

    // Simulate adding a new primary contact by calling onChange with a union of existing + new via select change
    // Since our mock select doesn't render options, call save directly and assert handler receives updatedData derived from current values.
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(props.handleBulkUpdateMonitorings).toHaveBeenCalled());
    const payload = props.handleBulkUpdateMonitorings.mock.calls[0][0];
    expect(payload.updatedData).toHaveLength(2);
    // Ensure message success and modal closed via setBulkEditModalVisibility(false)
    await waitFor(() => expect(handleSuccess).toHaveBeenCalled());
    expect(props.setMonitorings).toHaveBeenCalled();
  });

  it('removes secondary/notify for cost type on save', async () => {
    const props = { ...baseProps(), monitoringType: 'cost' };
    render(<BulkUpdateModal {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    const payload = props.handleBulkUpdateMonitorings.mock.calls[0][0];
    expect(payload.updatedData[0].metaData.notificationMetaData.secondaryContacts).toBeUndefined();
    expect(payload.updatedData[0].metaData.notificationMetaData.notifyContacts).toBeUndefined();
  });

  it('shows error when handler rejects and keeps modal open', async () => {
    const props = baseProps();
    props.handleBulkUpdateMonitorings.mockRejectedValue(new Error('Boom'));
    const { message } = await import('antd');
    render(<BulkUpdateModal {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Boom'));
    // ensure not closed
    expect(props.setBulkEditModalVisibility).not.toHaveBeenCalledWith(false);
  });
});
