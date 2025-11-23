/* eslint-disable */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('antd', async importOriginal => {
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
}));

// Mock redux selectors
let mockState = {};
vi.mock('react-redux', () => ({
  useSelector: sel => sel(mockState),
}));

// Mock service used by the table
const mockToggleStatus = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/orbitProfileMonitoring.service', () => ({
  default: {
    toggleStatus: (...args) => mockToggleStatus(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));
import OrbitMonitoringTable from '@/components/application/orbitProfileMonitoring/OrbitMonitoringTable.jsx';

const domains = [{ value: 'd1', label: 'Domain One' }];
const allProductCategories = [{ id: 'p1', name: 'Product Long Name', shortCode: 'PLN' }];

const rowApproved = {
  id: 1,
  monitoringName: 'Orbit Mon A',
  description: 'Desc',
  metaData: {
    asrSpecificMetaData: { domain: 'd1', productCategory: 'p1', buildName: 'Build123' },
    notificationConditions: ['condition1', 'condition2'],
  },
  creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@x.com' },
  isActive: true,
  approvalStatus: 'approved',
};

const rowPending = { ...rowApproved, id: 2, isActive: true, approvalStatus: 'pending' };

beforeEach(() => {
  vi.clearAllMocks();
  mockState = {
    application: {
      application: { applicationId: 'app-1' },
      integrations: [{ name: 'ASR', application_id: 'app-1' }],
    },
  };
});

describe('OrbitMonitoringTable', () => {
  it('renders actions and triggers view/edit/evaluate via More popover', async () => {
    const user = userEvent.setup();
    const setSelectedMonitoring = vi.fn();
    const setDisplayViewDetailsModal = vi.fn();
    const setApproveRejectModal = vi.fn();
    const onEdit = vi.fn();
    const onCopy = vi.fn();

    render(
      <OrbitMonitoringTable
        orbitMonitoringData={[rowApproved]}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setApproveRejectModal={setApproveRejectModal}
        onEdit={onEdit}
        onCopy={onCopy}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        loading={false}
        isReader={false}
        applicationId="app-1"
        searchTerm=""
      />
    );

    // View details icon
    await user.click(screen.getByRole('button', { name: 'view' }));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);

    // Edit icon
    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(onEdit).toHaveBeenCalledWith(rowApproved);

    // More popover content is always rendered in mock; click Approve / Reject
    await user.click(screen.getByText('Approve / Reject'));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setApproveRejectModal).toHaveBeenCalledWith(true);

    // Duplicate path
    await user.click(screen.getByText('Duplicate'));
    expect(onCopy).toHaveBeenCalledWith(rowApproved);
  });

  it('performs toggle when pause/start is clicked', async () => {
    const user = userEvent.setup();
    const onToggleStatus = vi.fn();

    render(
      <OrbitMonitoringTable
        orbitMonitoringData={[rowApproved]}
        setSelectedMonitoring={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setApproveRejectModal={vi.fn()}
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={onToggleStatus}
        setSelectedRows={vi.fn()}
        selectedRows={[]}
        loading={false}
        isReader={false}
        applicationId="app-1"
        searchTerm=""
      />
    );

    await user.click(screen.getByText('Pause'));
    await waitFor(() => expect(onToggleStatus).toHaveBeenCalledWith([rowApproved.id], false));
  });

  it('allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <OrbitMonitoringTable
        orbitMonitoringData={[rowApproved]}
        setSelectedMonitoring={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setApproveRejectModal={vi.fn()}
        onEdit={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
        setSelectedRows={setSelectedRows}
        selectedRows={[]}
        loading={false}
        isReader={false}
        applicationId="app-1"
        searchTerm=""
      />
    );

    // Select first row using mock button
    await user.click(screen.getByRole('button', { name: 'select-first' }));
    expect(setSelectedRows).toHaveBeenCalled();
  });
});
