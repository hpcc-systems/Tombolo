/* eslint-disable */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockTable = ({ dataSource = [], columns = [], rowSelection }) => (
    <div>
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
        <button aria-label="select-first" onClick={() => rowSelection.onChange?.([dataSource[0]?.id], [dataSource[0]])}>
          select-first
        </button>
      ) : null}
    </div>
  );
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
  const notification = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  return {
    ...antd,
    Table: MockTable,
    Tooltip: MockTooltip,
    Popover: MockPopover,
    Popconfirm: MockPopconfirm,
    Tag: MockTag,
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
  WarningFilled: () => <span>!</span>,
  DashboardOutlined: () => <span>dash</span>,
}));

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));

vi.mock('react-redux', () => ({
  useSelector: (sel) =>
    sel({
      application: {
        application: { applicationId: 'app-1' },
        integrations: [{ name: 'ASR', application_id: 'app-1' }],
      },
    }),
}));

const mockToggle = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/jobMonitoring.service', () => ({
  default: {
    toggle: (...args) => mockToggle(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

import { notification } from 'antd';
import JobMonitoringTable from '@/components/application/jobMonitoring/JobMonitoringTable.jsx';
import { APPROVAL_STATUS } from '@/components/common/Constants';

const clusters = [
  { id: 'c1', name: 'Cluster One', reachabilityInfo: { reachable: false } },
  { id: 'c2', name: 'Cluster Two', reachabilityInfo: { reachable: true } },
];

const domains = [{ value: 'd1', label: 'Domain One' }];
const allProductCategories = [{ id: 'p1', name: 'Product Long Name', shortCode: 'PLN' }];

const rowApproved = {
  id: 1,
  monitoringName: 'Job Mon A',
  description: 'Desc',
  clusterId: 'c1',
  jobName: 'job*',
  metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' } },
  creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@x.com' },
  isActive: true,
  approvalStatus: APPROVAL_STATUS.APPROVED,
};

const rowPending = { ...rowApproved, id: 2, clusterId: 'c2', isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };

describe('JobMonitoringTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders actions and triggers view/edit/approve/duplicate via More popover', async () => {
    const user = userEvent.setup();
    const setSelectedMonitoring = vi.fn();
    const setDisplayMonitoringDetailsModal = vi.fn();
    const setDisplayAddJobMonitoringModal = vi.fn();
    const setDisplayAddRejectModal = vi.fn();
    const setEditingData = vi.fn();
    const setDuplicatingData = vi.fn();

    render(
      <JobMonitoringTable
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        jobMonitorings={[rowApproved]}
        setJobMonitorings={vi.fn()}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringJobs={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    await user.click(screen.getByRole('button', { name: 'view' }));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: rowApproved });
    expect(setDisplayAddJobMonitoringModal).toHaveBeenCalledWith(true);

    await user.click(screen.getByText('Approve / Reject'));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);

    await user.click(screen.getByText('Duplicate'));
    expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: rowApproved });
    expect(setDisplayAddJobMonitoringModal).toHaveBeenCalledWith(true);
  });

  it('shows error when starting non-approved; toggles when approved', async () => {
    const user = userEvent.setup();
    const setJobMonitorings = vi.fn();

    const { rerender } = render(
      <JobMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        jobMonitorings={[rowPending]}
        setJobMonitorings={setJobMonitorings}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddJobMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringJobs={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    await user.click(screen.getByText('Start'));
    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error occurred',
        description: expect.anything(),
      })
    );

    rerender(
      <JobMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        jobMonitorings={[rowApproved]}
        setJobMonitorings={setJobMonitorings}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddJobMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringJobs={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    const pauseBtn = await screen.findByText('pause');
    mockToggle.mockResolvedValueOnce({ updatedJobMonitorings: [{ ...rowApproved, isActive: false }] });
    await user.click(pauseBtn);
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith({ ids: [rowApproved.id] }));
    expect(setJobMonitorings).toHaveBeenCalled();
  });

  it('deletes a monitoring via Popconfirm and updates state', async () => {
    const user = userEvent.setup();
    const setJobMonitorings = vi.fn();

    render(
      <JobMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        jobMonitorings={[rowApproved]}
        setJobMonitorings={setJobMonitorings}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddJobMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringJobs={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    mockDelete.mockResolvedValueOnce();
    await user.click(screen.getByRole('button', { name: 'confirm' }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith({ id: rowApproved.id }));
    expect(setJobMonitorings).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
  });

  it('renders unreachable cluster tag and allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <JobMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        jobMonitorings={[rowApproved]}
        setJobMonitorings={vi.fn()}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddJobMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={setSelectedRows}
        selectedRows={[]}
        filteringJobs={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    expect(screen.getByText('Cluster not reachable')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'select-first' }));
    expect(setSelectedRows).toHaveBeenCalledWith([rowApproved]);
  });
});
