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
  useSelector: sel =>
    sel({
      application: {
        application: { applicationId: 'app-1' },
        integrations: [{ name: 'ASR', application_id: 'app-1' }],
      },
    }),
}));

const mockToggle = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/fileMonitoring.service', () => ({
  default: {
    toggle: (...args) => mockToggle(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

import { notification } from 'antd';
import FileMonitoringTable from '@/components/application/fileMonitoring/FileMonitoringTable';
import type { FileMonitoringDTO } from '@tombolo/shared';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import {
  assertNonApprovedToggleError,
  clickSelectFirstRow,
  runCommonTableActions,
} from '@/tests/application/testUtils/tableAssertions';

const clusters = [
  { id: 'c1', name: 'Cluster One', reachabilityInfo: { reachable: false } },
  { id: 'c2', name: 'Cluster Two', reachabilityInfo: { reachable: true } },
];

const domains = [{ value: 'd1', label: 'Domain One' }];
const allProductCategories = [{ id: 'p1', name: 'Product Long Name', shortCode: 'PLN' }];

const rowApproved = {
  id: '1',
  monitoringName: 'File Mon A',
  description: 'Desc',
  cluster: { name: 'Cluster One', thor_host: 'h', thor_port: 123 },
  clusterId: 'c1',
  metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' } },
  creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@x.com' },
  isActive: true,
  approvalStatus: APPROVAL_STATUS.APPROVED,
} as unknown as FileMonitoringDTO;

const rowPending = {
  ...rowApproved,
  id: '2',
  clusterId: 'c2',
  isActive: false,
  approvalStatus: APPROVAL_STATUS.PENDING,
} as unknown as FileMonitoringDTO;

describe('FileMonitoringTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders actions and triggers view/edit/approve/duplicate via More popover', async () => {
    const user = userEvent.setup();
    const setSelectedMonitoring = vi.fn();
    const setDisplayMonitoringDetailsModal = vi.fn();
    const setDisplayAddFileMonitoringModal = vi.fn();
    const setDisplayAddRejectModal = vi.fn();
    const setEditingData = vi.fn();
    const setDuplicatingData = vi.fn();

    render(
      <FileMonitoringTable
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        fileMonitoring={[rowApproved] as FileMonitoringDTO[]}
        setFileMonitoring={vi.fn()}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setDisplayAddFileMonitoringModal={setDisplayAddFileMonitoringModal}
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

    await runCommonTableActions(user, {
      onView: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);
      },
      onEdit: () => {
        expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: rowApproved.id });
        expect(setDisplayAddFileMonitoringModal).toHaveBeenCalledWith(true);
      },
      onApproveReject: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
      },
      onDuplicate: () => {
        expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: rowApproved });
        expect(setDisplayAddFileMonitoringModal).toHaveBeenCalledWith(true);
      },
    });
  });

  it('shows error when starting non-approved; toggles when approved; shows success', async () => {
    const user = userEvent.setup();
    const setFileMonitoring = vi.fn();

    const { rerender } = render(
      <FileMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        fileMonitoring={[rowPending]}
        setFileMonitoring={setFileMonitoring}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddFileMonitoringModal={vi.fn()}
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

    await assertNonApprovedToggleError(user, 'Start', notification.error);

    rerender(
      <FileMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        fileMonitoring={[rowApproved]}
        setFileMonitoring={setFileMonitoring}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddFileMonitoringModal={vi.fn()}
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

    const pauseIcon = await screen.findByText('pause');
    mockToggle.mockResolvedValueOnce([{ ...rowApproved, isActive: false }]);
    await user.click(pauseIcon);
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith({ ids: [rowApproved.id], action: 'pause' }));
    expect(setFileMonitoring).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
  });

  it('deletes a monitoring via Popconfirm and updates state', async () => {
    const user = userEvent.setup();
    const setFileMonitoring = vi.fn();

    render(
      <FileMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        fileMonitoring={[rowApproved]}
        setFileMonitoring={setFileMonitoring}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddFileMonitoringModal={vi.fn()}
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

    mockDelete.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole('button', { name: 'confirm' }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith([rowApproved.id]));
    expect(setFileMonitoring).toHaveBeenCalled();
    expect(notification.success).toHaveBeenCalled();
  });

  it('renders unreachable cluster tag and allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <FileMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        fileMonitoring={[rowApproved] as any}
        setFileMonitoring={vi.fn()}
        setSelectedMonitoring={vi.fn()}
        setDisplayAddFileMonitoringModal={vi.fn()}
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

    await screen.findByText('Cluster not reachable');

    await clickSelectFirstRow(user);
    expect(setSelectedRows).toHaveBeenCalledWith([rowApproved]);
  });
});
