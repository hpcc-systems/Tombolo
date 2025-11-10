/* eslint-disable */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks for antd minimal rendering similar to costMonitoring tests
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockTable = ({ dataSource = [], columns = [], rowSelection }) => {
    return (
      <div>
        <div data-testid="headers">
          {columns.map((c, i) => (
            <div key={i}>{c.title}</div>
          ))}
        </div>
        <div data-testid="rows">
          {dataSource.map((row, rIdx) => (
            <div key={row.id ?? rIdx} data-testid={`row-${rIdx}`}>
              {columns.map((col, cIdx) => {
                const value = col.dataIndex ? row[col.dataIndex] : row;
                const content = col.render ? col.render(value, row) : value;
                return (
                  <div key={cIdx} data-testid={`cell-${rIdx}-${cIdx}`}>
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {rowSelection ? (
          <button
            aria-label="select-first"
            onClick={() => rowSelection.onChange?.([dataSource[0]?.id], [dataSource[0]])}>
            select-first
          </button>
        ) : null}
      </div>
    );
  };
  const MockTooltip = ({ children }) => <>{children}</>;
  const MockPopover = ({ children, content }) => (
    <div>
      <span>{children}</span>
      <div data-testid="popover">{content}</div>
    </div>
  );
  const MockPopconfirm = ({ children, onConfirm }) => (
    <span>
      <button aria-label="confirm" onClick={onConfirm}>
        confirm
      </button>
      {children}
    </span>
  );
  const MockTag = ({ children }) => <span>{children}</span>;
  const message = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  const notification = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  return {
    ...antd,
    Table: MockTable,
    Tooltip: MockTooltip,
    Popover: MockPopover,
    Popconfirm: MockPopconfirm,
    Tag: MockTag,
    message,
    notification,
  };
});

vi.mock('@ant-design/icons', () => ({
  EyeOutlined: ({ onClick }) => (
    <button aria-label="view" onClick={onClick}>
      view
    </button>
  ),
  EditOutlined: ({ onClick }) => (
    <button aria-label="edit" onClick={onClick}>
      edit
    </button>
  ),
  DeleteOutlined: () => <span>del</span>,
  CheckCircleFilled: () => <span>approveIcon</span>,
  BellOutlined: () => <span>bell</span>,
  PlayCircleOutlined: () => <span>play</span>,
  PauseCircleOutlined: () => <span>pause</span>,
  CopyOutlined: () => <span>copy</span>,
  DownOutlined: () => <span>v</span>,
}));

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));

// Mock service used by the table
const mockToggleSingle = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/clusterMonitoring.service', () => ({
  default: {
    toggleSingle: (...args) => mockToggleSingle(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

import { message, notification } from 'antd';
import ClusterMonitoringTable from '@/components/application/clusterMonitoring/ClusterMonitoringTable.jsx';
import { APPROVAL_STATUS } from '@/components/common/Constants';

const rowApproved = {
  id: 1,
  monitoringName: 'Cluster Mon A',
  cluster: { name: 'Cluster One', thor_host: 'h', thor_port: 123 },
  clusterMonitoringType: ['CPU'],
  isActive: true,
  approvalStatus: APPROVAL_STATUS.APPROVED,
};

const rowPending = { ...rowApproved, id: 2, isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };

describe('ClusterMonitoringTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders actions and triggers view/edit/approve/duplicate via More popover', async () => {
    const user = userEvent.setup();
    const setSelectedMonitoring = vi.fn();
    const setDisplayViewDetailsModal = vi.fn();
    const setDisplayAddEditModal = vi.fn();
    const setApproveRejectModal = vi.fn();
    const setEditingMonitoring = vi.fn();
    const setDuplicatingData = vi.fn();

    render(
      <ClusterMonitoringTable
        clusterMonitoring={[rowApproved]}
        applicationId={'app-1'}
        setSelectedMonitoring={setSelectedMonitoring}
        isReader={false}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setEditingMonitoring={setEditingMonitoring}
        setApproveRejectModal={setApproveRejectModal}
        selectedRows={[]}
        setSelectedRows={vi.fn()}
        setDuplicatingData={setDuplicatingData}
        setClusterMonitoring={vi.fn()}
      />
    );

    // View
    await user.click(screen.getByRole('button', { name: 'view' }));
    expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);

    // Edit
    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(setEditingMonitoring).toHaveBeenCalledWith(true);
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);

    // Approve / Reject in More popover
    await user.click(screen.getByText('Approve / Reject'));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setApproveRejectModal).toHaveBeenCalledWith(true);

    // Duplicate
    await user.click(screen.getByText('Duplicate'));
    expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: rowApproved });
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
  });

  it('shows error when starting non-approved; toggles when approved; shows success message', async () => {
    const user = userEvent.setup();
    const setClusterMonitoring = vi.fn();

    const { rerender } = render(
      <ClusterMonitoringTable
        clusterMonitoring={[rowPending]}
        applicationId={'app-1'}
        setSelectedMonitoring={vi.fn()}
        isReader={false}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setEditingMonitoring={vi.fn()}
        setApproveRejectModal={vi.fn()}
        selectedRows={[]}
        setSelectedRows={vi.fn()}
        setDuplicatingData={vi.fn()}
        setClusterMonitoring={setClusterMonitoring}
      />
    );

    // For a pending and inactive monitoring, UI shows Start; clicking Start should error because not approved.
    await user.click(screen.getByText('Start'));
    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error occurred',
        description: expect.anything(),
      })
    );

    // Now approved row should toggle
    rerender(
      <ClusterMonitoringTable
        clusterMonitoring={[rowApproved]}
        applicationId={'app-1'}
        setSelectedMonitoring={vi.fn()}
        isReader={false}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setEditingMonitoring={vi.fn()}
        setApproveRejectModal={vi.fn()}
        selectedRows={[]}
        setSelectedRows={vi.fn()}
        setDuplicatingData={vi.fn()}
        setClusterMonitoring={setClusterMonitoring}
      />
    );

    const pauseBtn = await screen.findByText('pause');
    mockToggleSingle.mockResolvedValueOnce();
    await user.click(pauseBtn);
    await waitFor(() => expect(mockToggleSingle).toHaveBeenCalledWith(rowApproved.id));
    expect(setClusterMonitoring).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
  });

  it('deletes a monitoring via Popconfirm and updates state', async () => {
    const user = userEvent.setup();
    const setClusterMonitoring = vi.fn();

    render(
      <ClusterMonitoringTable
        clusterMonitoring={[rowApproved]}
        applicationId={'app-1'}
        setSelectedMonitoring={vi.fn()}
        isReader={false}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setEditingMonitoring={vi.fn()}
        setApproveRejectModal={vi.fn()}
        selectedRows={[]}
        setSelectedRows={vi.fn()}
        setDuplicatingData={vi.fn()}
        setClusterMonitoring={setClusterMonitoring}
      />
    );

    // In mocked Popconfirm we expose a confirm button
    mockDelete.mockResolvedValueOnce();
    await user.click(screen.getByRole('button', { name: 'confirm' }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(rowApproved.id));
    expect(setClusterMonitoring).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
  });

  it('allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <ClusterMonitoringTable
        clusterMonitoring={[rowApproved]}
        applicationId={'app-1'}
        setSelectedMonitoring={vi.fn()}
        isReader={false}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setEditingMonitoring={vi.fn()}
        setApproveRejectModal={vi.fn()}
        selectedRows={[]}
        setSelectedRows={setSelectedRows}
        setDuplicatingData={vi.fn()}
        setClusterMonitoring={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'select-first' }));
    expect(setSelectedRows).toHaveBeenCalledWith([rowApproved]);
  });
});
