import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('antd', async importOriginal => {
  const antd = await importOriginal();
  const { createTableAntdMocks } = await import('@/tests/application/testUtils/antdTableMock');
  return { ...(antd as any), ...createTableAntdMocks() };
});

vi.mock('@ant-design/icons', async () => {
  const { monitoringTableIconMocks } = await import('@/tests/application/testUtils/antdIconMock');
  return monitoringTableIconMocks;
});

// Mock redux selectors
let mockState = {};
vi.mock('react-redux', () => ({
  useSelector: sel => sel(mockState),
}));

// Mock service used by the table
const mockToggle = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/costMonitoring.service', () => ({
  default: {
    toggle: (...args) => mockToggle(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

import { notification } from 'antd';
vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));
import CostMonitoringTable from '@/components/application/costMonitoring/CostMonitoringTable';
import type { CostMonitoringDTO } from '@tombolo/shared';
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
  monitoringName: 'Cost Mon A',
  description: 'Desc',
  clusterIds: ['c1'],
  metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' }, users: ['u1'] },
  creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@x.com' },
  isActive: true,
  approvalStatus: 'approved',
} as unknown as CostMonitoringDTO;

const rowPending = {
  ...rowApproved,
  id: '2',
  clusterIds: ['c2'],
  isActive: true,
  approvalStatus: 'pending',
} as unknown as CostMonitoringDTO;

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

    await runCommonTableActions(user, {
      onView: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);
      },
      onEdit: () => {
        expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: rowApproved.id });
        expect(setDisplayAddCostMonitoringModal).toHaveBeenCalledWith(true);
      },
      onApproveReject: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
      },
      onDuplicate: () => {
        expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: rowApproved });
        expect(setDisplayAddCostMonitoringModal).toHaveBeenCalledWith(true);
      },
    });
  });

  it('shows error when pausing/starting a non-approved monitoring; performs toggle when approved', async () => {
    const user = userEvent.setup();
    const setCostMonitorings = vi.fn();

    const { rerender } = render(
      <CostMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        costMonitorings={[rowPending] as CostMonitoringDTO[]}
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

    await assertNonApprovedToggleError(user, 'Pause', notification.error);

    // Approved row triggers toggle util and state update
    rerender(
      <CostMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        costMonitorings={[rowApproved] as CostMonitoringDTO[]}
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

    mockToggle.mockResolvedValueOnce({ updatedCostMonitorings: [{ ...rowApproved, isActive: false }] });
    await user.click(screen.getByText('Pause'));
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith({ ids: [rowApproved.id], action: 'pause' }));
    expect(setCostMonitorings).toHaveBeenCalled();
  });

  it('renders unreachable cluster tag and allows row selection to set selected rows', async () => {
    const user = userEvent.setup();
    const setSelectedRows = vi.fn();

    render(
      <CostMonitoringTable
        setEditingData={vi.fn()}
        setDuplicatingData={vi.fn()}
        costMonitorings={[rowApproved] as CostMonitoringDTO[]}
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

    await clickSelectFirstRow(user);
    expect(setSelectedRows).toHaveBeenCalled();
  });
});
