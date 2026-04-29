import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('antd', async importOriginal => {
  const antd = await importOriginal();
  const { createTableAntdMocks } = await import('@/tests/application/testUtils/antdTableMock');
  return { ...(antd as any), ...createTableAntdMocks() };
});

vi.mock('@ant-design/icons', async () => {
  const { monitoringTableIconMocks } = await import('@/tests/application/testUtils/antdIconMock');
  return monitoringTableIconMocks;
});

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));

vi.mock('react-redux', () => ({
  useSelector: sel => sel({ application: { application: { applicationId: 'app-1' } } }),
}));

const mockToggle = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/landingZoneMonitoring.service', () => ({
  default: {
    toggle: (...args) => mockToggle(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

import { notification } from 'antd';
import LandingZoneMonitoringTable from '@/components/application/LandingZoneMonitoring/LandingZoneMonitoringTable';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import {
  assertNonApprovedToggleError,
  clickSelectFirstRow,
  runCommonTableActions,
} from '@/tests/application/testUtils/tableAssertions';

const rowApproved = {
  id: '1',
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

const rowPending = { ...rowApproved, id: '2', isActive: false, approvalStatus: APPROVAL_STATUS.PENDING };

describe('LandingZoneMonitoringTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    await runCommonTableActions(user, {
      onView: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);
      },
      onEdit: () => {
        expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: rowApproved });
        expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
      },
      onApproveReject: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
      },
      onDuplicate: () => {
        expect(setCopying).toHaveBeenCalledWith(true);
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
      },
    });
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

    await assertNonApprovedToggleError(user, 'Start', notification.error);

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
    mockToggle.mockResolvedValueOnce(undefined);
    await user.click(pauseIcon);
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith([rowApproved.id], false));
    expect(setLandingZoneMonitoring).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
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

    mockDelete.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole('button', { name: 'confirm' }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(rowApproved.id));
    expect(setLandingZoneMonitoring).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
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

    await clickSelectFirstRow(user);
    expect(setSelectedRows).toHaveBeenCalledWith([rowApproved]);
  });
});
