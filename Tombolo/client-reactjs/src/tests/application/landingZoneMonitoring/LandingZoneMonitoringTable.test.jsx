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
                <div key={cIdx} data-testid={`cell-${rIdx}-${cIdx}`}>{content}</div>
              );
            })}
          </div>
        ))}
      </div>
      {rowSelection ? (
        <button aria-label="select-first" onClick={() => rowSelection.onChange?.([dataSource[0]?.id], [dataSource[0]])}>select-first</button>
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
      <button aria-label="confirm" onClick={onConfirm}>confirm</button>
      {children}
    </span>
  );
  const message = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  return { ...antd, Table: MockTable, Tooltip: MockTooltip, Popover: MockPopover, Popconfirm: MockPopconfirm, message };
});

vi.mock('@ant-design/icons', () => ({
  EyeOutlined: ({ onClick }) => (<button aria-label="view" onClick={onClick}>view</button>),
  EditOutlined: ({ onClick }) => (<button aria-label="edit" onClick={onClick}>edit</button>),
  DeleteOutlined: () => <span>del</span>,
  CheckCircleFilled: () => <span>approveIcon</span>,
  BellOutlined: () => <span>bell</span>,
  PlayCircleOutlined: () => <span>play</span>,
  PauseCircleOutlined: () => <span>pause</span>,
  CopyOutlined: () => <span>copy</span>,
  DownOutlined: () => <span>v</span>,
}));

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));

vi.mock('react-redux', () => ({ useSelector: (sel) => sel({ application: { application: { applicationId: 'app-1' } } }) }));

vi.mock('@/components/application/LandingZoneMonitoring/Utils', () => ({
  deleteLzMonitoring: vi.fn().mockResolvedValue(),
  toggleLzMonitoringStatus: vi.fn().mockResolvedValue(),
}));

import { message } from 'antd';
import { deleteLzMonitoring, toggleLzMonitoringStatus } from '@/components/application/LandingZoneMonitoring/Utils';
import LandingZoneMonitoringTable from '@/components/application/LandingZoneMonitoring/LandingZoneMonitoringTable.jsx';
import { APPROVAL_STATUS } from '@/components/common/Constants';

const rowApproved = {
  id: 1,
  monitoringName: 'LZ Mon A',
  description: 'Desc',
  'cluster.name': 'Cluster One',
  'cluster.thor_host': 'h',
  'cluster.thor_port': 123,
  metaData: { monitoringData: { dropzone: 'dz', directory: '/dir' } },
  creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@x.com' },
  isActive: true,
  approvalStatus: APPROVAL_STATUS.APPROVED,
};

const rowPending = { ...rowApproved, id: 2, isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };

describe('LandingZoneMonitoringTable', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders actions and triggers view/edit/approve/duplicate via More popover', async () => {
    const user = userEvent.setup();
    const setSelectedMonitoring = vi.fn();
    const setDisplayViewDetailsModal = vi.fn();
    const setDisplayAddEditModal = vi.fn();
    const setDisplayAddRejectModal = vi.fn();
    const setEditingData = vi.fn();
    const setCopying = vi.fn();

    render(
      <LandingZoneMonitoringTable
        setEditingData={setEditingData}
        setLandingZoneMonitoring={vi.fn()}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        setSelectedRows={vi.fn()}
        setCopying={setCopying}
        isReader={false}
        filteredLzMonitorings={[rowApproved]}
        searchTerm=""
      />
    );

    await user.click(screen.getByRole('button', { name: 'view' }));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: rowApproved });
    expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);

    await user.click(screen.getByText('Approve / Reject'));
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);

    await user.click(screen.getByText('Duplicate'));
    expect(setCopying).toHaveBeenCalledWith(true);
    expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
    expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
  });

  it('shows error when starting non-approved; toggles when approved and shows success', async () => {
    const user = userEvent.setup();
    const setLandingZoneMonitoring = vi.fn();

    const { rerender } = render(
      <LandingZoneMonitoringTable
        setEditingData={vi.fn()}
        setLandingZoneMonitoring={setLandingZoneMonitoring}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        setCopying={vi.fn()}
        isReader={false}
        filteredLzMonitorings={[rowPending]}
        searchTerm=""
      />
    );

    await user.click(screen.getByText('Start'));
    expect(message.error).toHaveBeenCalledWith('Monitoring must be in approved state before it can be started');

    rerender(
      <LandingZoneMonitoringTable
        setEditingData={vi.fn()}
        setLandingZoneMonitoring={setLandingZoneMonitoring}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        setCopying={vi.fn()}
        isReader={false}
        filteredLzMonitorings={[rowApproved]}
        searchTerm=""
      />
    );

    const pauseIcon = await screen.findByText('pause');
    await user.click(pauseIcon);
    await waitFor(() => expect(toggleLzMonitoringStatus).toHaveBeenCalled());
    expect(setLandingZoneMonitoring).toHaveBeenCalled();
    expect(message.success).toHaveBeenCalledWith('Monitoring status toggled successfully');
  });

  it('deletes a monitoring via Popconfirm and updates state', async () => {
    const user = userEvent.setup();
    const setLandingZoneMonitoring = vi.fn();

    render(
      <LandingZoneMonitoringTable
        setEditingData={vi.fn()}
        setLandingZoneMonitoring={setLandingZoneMonitoring}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={vi.fn()}
        setCopying={vi.fn()}
        isReader={false}
        filteredLzMonitorings={[rowApproved]}
        searchTerm=""
      />
    );

    await user.click(screen.getByRole('button', { name: 'confirm' }));
    await waitFor(() => expect(deleteLzMonitoring).toHaveBeenCalledWith({ id: rowApproved.id }));
    expect(setLandingZoneMonitoring).toHaveBeenCalled();
    expect(message.success).toHaveBeenCalledWith('Landing zone monitoring deleted successfully');
  });

  it('allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <LandingZoneMonitoringTable
        setEditingData={vi.fn()}
        setLandingZoneMonitoring={vi.fn()}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddEditModal={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setDisplayAddRejectModal={vi.fn()}
        setSelectedRows={setSelectedRows}
        setCopying={vi.fn()}
        isReader={false}
        filteredLzMonitorings={[rowApproved]}
        searchTerm=""
      />
    );

    await user.click(screen.getByRole('button', { name: 'select-first' }));
    expect(setSelectedRows).toHaveBeenCalledWith([rowApproved]);
  });
});
