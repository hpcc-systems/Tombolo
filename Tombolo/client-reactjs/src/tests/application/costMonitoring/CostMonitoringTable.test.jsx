/* eslint-disable */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();
  const MockTable = ({ dataSource = [], columns = [], rowSelection }) => {
    // Render a simple table: headers and rows with rendered cells
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
            onClick={() => rowSelection.onChange?.([dataSource[0]?.id], [dataSource[0]])}
          >
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
  return { ...antd, Table: MockTable, Tooltip: MockTooltip, Popover: MockPopover, Popconfirm: MockPopconfirm, Tag: MockTag, message };
});

vi.mock('@ant-design/icons', () => ({
  EyeOutlined: ({ onClick }) => (
    <button aria-label="view" onClick={onClick}>view</button>
  ),
  EditOutlined: ({ onClick }) => (
    <button aria-label="edit" onClick={onClick}>edit</button>
  ),
  DeleteOutlined: () => <span>del</span>,
  CheckCircleFilled: () => <span>approveIcon</span>,
  BellOutlined: () => <span>bell</span>,
  PlayCircleOutlined: () => <span>play</span>,
  PauseCircleOutlined: () => <span>pause</span>,
  CopyOutlined: () => <span>copy</span>,
  DownOutlined: () => <span>v</span>,
  WarningFilled: () => <span>!</span>,
}));

// Mock redux selectors
let mockState = {};
vi.mock('react-redux', () => ({
  useSelector: (sel) => sel(mockState),
}));

// Mock utils used by the table
vi.mock('@/components/application/costMonitoring/costMonitoringUtils', () => ({
  handleDeleteCostMonitoring: vi.fn().mockResolvedValue(),
  toggleCostMonitoringStatus: vi.fn().mockResolvedValue([{ id: 1, approvalStatus: 'approved', isActive: false }]),
}));

import { message } from 'antd';
import { toggleCostMonitoringStatus } from '@/components/application/costMonitoring/costMonitoringUtils';
vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));
import CostMonitoringTable from '@/components/application/costMonitoring/CostMonitoringTable.jsx';

const clusters = [
  { id: 'c1', name: 'Cluster One', reachabilityInfo: { reachable: false } },
  { id: 'c2', name: 'Cluster Two', reachabilityInfo: { reachable: true } },
];

const domains = [{ value: 'd1', label: 'Domain One' }];
const allProductCategories = [{ id: 'p1', name: 'Product Long Name', shortCode: 'PLN' }];

const rowApproved = {
  id: 1,
  monitoringName: 'Cost Mon A',
  description: 'Desc',
  clusterIds: ['c1'],
  metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' }, users: ['u1'] },
  creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@x.com' },
  isActive: true,
  approvalStatus: 'approved',
};

const rowPending = { ...rowApproved, id: 2, clusterIds: ['c2'], isActive: true, approvalStatus: 'pending' };

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    application: {
      application: { applicationId: 'app-1' },
      integrations: [{ name: 'ASR', application_id: 'app-1' }],
    },
  };
});

describe('CostMonitoringTable', () => {
  it('renders actions and triggers view/edit/evaluate via More popover', async () => {
    const user = userEvent.setup();
    const setSelectedMonitoring = vi.fn();
    const setDisplayMonitoringDetailsModal = vi.fn();
    const setDisplayAddCostMonitoringModal = vi.fn();
    const setDisplayAddRejectModal = vi.fn();
    const setEditingData = vi.fn();
    const setDuplicatingData = vi.fn();

    render(
      <CostMonitoringTable
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        costMonitorings={[rowApproved]}
        setCostMonitorings={vi.fn()}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddCostMonitoringModal={setDisplayAddCostMonitoringModal}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringCosts={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    // View details icon
    await user.click(screen.getByRole('button', { name: 'view' }));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);

    // Edit icon
    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: rowApproved.id });
    expect(setDisplayAddCostMonitoringModal).toHaveBeenCalledWith(true);

    // More popover content is always rendered in mock; click Approve / Reject
    await user.click(screen.getByText('Approve / Reject'));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);

    // Duplicate path
    await user.click(screen.getByText('Duplicate'));
    expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: rowApproved });
    expect(setDisplayAddCostMonitoringModal).toHaveBeenCalledWith(true);
  });

  it('shows error when pausing/starting a non-approved monitoring; performs toggle when approved', async () => {
    const user = userEvent.setup();
    const setCostMonitorings = vi.fn();

    const { rerender } = render(
      <CostMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        costMonitorings={[rowPending]}
        setCostMonitorings={setCostMonitorings}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddCostMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringCosts={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    await user.click(screen.getByText('Pause'));
    expect(message.error).toHaveBeenCalledWith('Monitoring must be in approved state before it can be started');

    // Approved row triggers toggle util and state update
    rerender(
      <CostMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        costMonitorings={[rowApproved]}
        setCostMonitorings={setCostMonitorings}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddCostMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        filteringCosts={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    await user.click(screen.getByText('Pause'));
    await waitFor(() => expect(toggleCostMonitoringStatus).toHaveBeenCalled());
    expect(setCostMonitorings).toHaveBeenCalled();
  });

  it('renders unreachable cluster tag and allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <CostMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        costMonitorings={[rowApproved]}
        setCostMonitorings={vi.fn()}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddCostMonitoringModal={vi.fn()}
        setDisplayMonitoringDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={setSelectedRows}
        selectedRows={[]}
        filteringCosts={false}
        isReader={false}
        clusters={clusters}
        domains={domains}
        allProductCategories={allProductCategories}
        searchTerm=""
      />
    );

    // Unreachable tag text
    expect(screen.getByText('Cluster not reachable')).toBeInTheDocument();

    // Select first row using mock button
    await user.click(screen.getByRole('button', { name: 'select-first' }));
    expect(setSelectedRows).toHaveBeenCalled();
  });
});
