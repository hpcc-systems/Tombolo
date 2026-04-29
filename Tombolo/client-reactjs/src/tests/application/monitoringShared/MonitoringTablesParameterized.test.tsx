import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

let mockState: any = {};
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(mockState),
}));

import JobMonitoringTable from '@/components/application/jobMonitoring/JobMonitoringTable';
import CostMonitoringTable from '@/components/application/costMonitoring/CostMonitoringTable';
import FileMonitoringTable from '@/components/application/fileMonitoring/FileMonitoringTable';
import OrbitMonitoringTable from '@/components/application/orbitProfileMonitoring/OrbitMonitoringTable';
import LandingZoneMonitoringTable from '@/components/application/LandingZoneMonitoring/LandingZoneMonitoringTable';
import ClusterMonitoringTable from '@/components/application/clusterMonitoring/ClusterMonitoringTable';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import { clickSelectFirstRow, runCommonTableActions } from '@/tests/application/testUtils/tableAssertions';

const clusters = [
  { id: 'c1', name: 'Cluster One', reachabilityInfo: { reachable: false } },
  { id: 'c2', name: 'Cluster Two', reachabilityInfo: { reachable: true } },
];
const domains = [{ value: 'd1', label: 'Domain One' }];
const allProductCategories = [{ id: 'p1', name: 'Product', shortCode: 'P' }];

type CaseContext = {
  expectApprove: () => void;
  expectDuplicate: () => void;
  expectEdit: () => void;
  expectSelection: () => void;
  expectView: () => void;
};

type MonitoringCase = {
  name: string;
  renderTable: () => CaseContext;
};

const monitoringCases: MonitoringCase[] = [
  {
    name: 'job',
    renderTable: () => {
      const row = {
        id: '1',
        monitoringName: 'Job Mon A',
        clusterId: 'c1',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true,
        metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' } },
        creator: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      };
      const setSelectedMonitoring = vi.fn();
      const setDisplayMonitoringDetailsModal = vi.fn();
      const setDisplayAddJobMonitoringModal = vi.fn();
      const setDisplayAddRejectModal = vi.fn();
      const setEditingData = vi.fn();
      const setDuplicatingData = vi.fn();
      const setSelectedRows = vi.fn();

      render(
        <JobMonitoringTable
          setEditingData={setEditingData}
          setDuplicatingData={setDuplicatingData}
          jobMonitorings={[row] as any}
          setJobMonitorings={vi.fn()}
          setSelectedMonitoring={setSelectedMonitoring}
          setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          setDisplayAddRejectModal={setDisplayAddRejectModal}
          setSelectedRows={setSelectedRows}
          selectedRows={[]}
          filteringJobs={false}
          isReader={false}
          clusters={clusters as any}
          domains={domains as any}
          allProductCategories={allProductCategories as any}
          productCategories={[]}
          searchTerm=""
        />
      );

      return {
        expectView: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);
        },
        expectEdit: () => {
          expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: row });
          expect(setDisplayAddJobMonitoringModal).toHaveBeenCalledWith(true);
        },
        expectApprove: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
        },
        expectDuplicate: () => {
          expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: row });
          expect(setDisplayAddJobMonitoringModal).toHaveBeenCalledWith(true);
        },
        expectSelection: () => {
          expect(setSelectedRows).toHaveBeenCalledWith([row]);
        },
      };
    },
  },
  {
    name: 'cost',
    renderTable: () => {
      const row = {
        id: '1',
        monitoringName: 'Cost Mon A',
        clusterIds: ['c1'],
        approvalStatus: 'approved',
        isActive: true,
        metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' }, users: ['u1'] },
        creator: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      };
      const setSelectedMonitoring = vi.fn();
      const setDisplayMonitoringDetailsModal = vi.fn();
      const setDisplayAddCostMonitoringModal = vi.fn();
      const setDisplayAddRejectModal = vi.fn();
      const setEditingData = vi.fn();
      const setDuplicatingData = vi.fn();
      const setSelectedRows = vi.fn();

      render(
        <CostMonitoringTable
          setEditingData={setEditingData}
          setDuplicatingData={setDuplicatingData}
          costMonitorings={[row] as any}
          setCostMonitorings={vi.fn()}
          setSelectedMonitoring={setSelectedMonitoring}
          setDisplayAddCostMonitoringModal={setDisplayAddCostMonitoringModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          setDisplayAddRejectModal={setDisplayAddRejectModal}
          setSelectedRows={setSelectedRows}
          selectedRows={[]}
          filteringCosts={false}
          isReader={false}
          clusters={clusters as any}
          domains={domains as any}
          allProductCategories={allProductCategories as any}
          searchTerm=""
        />
      );

      return {
        expectView: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);
        },
        expectEdit: () => {
          expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: row.id });
          expect(setDisplayAddCostMonitoringModal).toHaveBeenCalledWith(true);
        },
        expectApprove: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
        },
        expectDuplicate: () => {
          expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: row });
          expect(setDisplayAddCostMonitoringModal).toHaveBeenCalledWith(true);
        },
        expectSelection: () => {
          expect(setSelectedRows).toHaveBeenCalled();
        },
      };
    },
  },
  {
    name: 'file',
    renderTable: () => {
      const row = {
        id: '1',
        monitoringName: 'File Mon A',
        description: 'desc',
        clusterId: 'c1',
        cluster: { name: 'Cluster One', thor_host: 'h', thor_port: 1 },
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true,
        metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' } },
        creator: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      };
      const setSelectedMonitoring = vi.fn();
      const setDisplayMonitoringDetailsModal = vi.fn();
      const setDisplayAddFileMonitoringModal = vi.fn();
      const setDisplayAddRejectModal = vi.fn();
      const setEditingData = vi.fn();
      const setDuplicatingData = vi.fn();
      const setSelectedRows = vi.fn();

      render(
        <FileMonitoringTable
          setEditingData={setEditingData}
          setDuplicatingData={setDuplicatingData}
          fileMonitoring={[row] as any}
          setFileMonitoring={vi.fn()}
          setSelectedMonitoring={setSelectedMonitoring}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          setDisplayAddFileMonitoringModal={setDisplayAddFileMonitoringModal}
          setDisplayAddRejectModal={setDisplayAddRejectModal}
          setSelectedRows={setSelectedRows}
          selectedRows={[]}
          filteringCosts={false}
          isReader={false}
          clusters={clusters as any}
          domains={domains as any}
          allProductCategories={allProductCategories as any}
          searchTerm=""
        />
      );

      return {
        expectView: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(true);
        },
        expectEdit: () => {
          expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: row.id });
          expect(setDisplayAddFileMonitoringModal).toHaveBeenCalledWith(true);
        },
        expectApprove: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
        },
        expectDuplicate: () => {
          expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: row });
          expect(setDisplayAddFileMonitoringModal).toHaveBeenCalledWith(true);
        },
        expectSelection: () => {
          expect(setSelectedRows).toHaveBeenCalledWith([row]);
        },
      };
    },
  },
  {
    name: 'orbit',
    renderTable: () => {
      const row = {
        id: '1',
        monitoringName: 'Orbit Mon A',
        approvalStatus: 'approved',
        isActive: true,
        metaData: { asrSpecificMetaData: { buildName: 'B1' } },
        creator: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      };
      const setSelectedMonitoring = vi.fn();
      const setDisplayViewDetailsModal = vi.fn();
      const setApproveRejectModal = vi.fn();
      const onEdit = vi.fn();
      const onCopy = vi.fn();
      const setSelectedRows = vi.fn();

      render(
        <OrbitMonitoringTable
          orbitMonitoringData={[row] as any}
          setSelectedMonitoring={setSelectedMonitoring}
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          setApproveRejectModal={setApproveRejectModal}
          onEdit={onEdit}
          onCopy={onCopy}
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

      return {
        expectView: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);
        },
        expectEdit: () => {
          expect(onEdit).toHaveBeenCalledWith(row);
        },
        expectApprove: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setApproveRejectModal).toHaveBeenCalledWith(true);
        },
        expectDuplicate: () => {
          expect(onCopy).toHaveBeenCalledWith(row);
        },
        expectSelection: () => {
          expect(setSelectedRows).toHaveBeenCalled();
        },
      };
    },
  },
  {
    name: 'landing-zone',
    renderTable: () => {
      const row = {
        id: '1',
        monitoringName: 'LZ Mon A',
        description: 'desc',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true,
        'cluster.name': 'Cluster One',
        metaData: { monitoringData: { dropzone: 'dz', directory: '/dir' } },
        creator: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      };
      const setSelectedMonitoring = vi.fn();
      const setDisplayViewDetailsModal = vi.fn();
      const setDisplayAddEditModal = vi.fn();
      const setDisplayAddRejectModal = vi.fn();
      const setEditingData = vi.fn();
      const setCopying = vi.fn();
      const setSelectedRows = vi.fn();

      render(
        <LandingZoneMonitoringTable
          setEditingData={setEditingData}
          setLandingZoneMonitoring={vi.fn()}
          setSelectedMonitoring={setSelectedMonitoring}
          setDisplayAddEditModal={setDisplayAddEditModal}
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          setDisplayAddRejectModal={setDisplayAddRejectModal}
          setSelectedRows={setSelectedRows}
          setCopying={setCopying}
          isReader={false}
          filteredLzMonitorings={[row] as any}
          searchTerm=""
        />
      );

      return {
        expectView: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);
        },
        expectEdit: () => {
          expect(setEditingData).toHaveBeenCalledWith({ isEditing: true, selectedMonitoring: row });
          expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
        },
        expectApprove: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddRejectModal).toHaveBeenCalledWith(true);
        },
        expectDuplicate: () => {
          expect(setCopying).toHaveBeenCalledWith(true);
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
        },
        expectSelection: () => {
          expect(setSelectedRows).toHaveBeenCalledWith([row]);
        },
      };
    },
  },
  {
    name: 'cluster',
    renderTable: () => {
      const row = {
        id: '1',
        monitoringName: 'Cluster Mon A',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true,
        cluster: { name: 'Cluster One', thor_host: 'h', thor_port: 1 },
        clusterMonitoringType: ['usage'],
      };
      const setSelectedMonitoring = vi.fn();
      const setDisplayViewDetailsModal = vi.fn();
      const setDisplayAddEditModal = vi.fn();
      const setApproveRejectModal = vi.fn();
      const setEditingMonitoring = vi.fn();
      const setDuplicatingData = vi.fn();
      const setSelectedRows = vi.fn();

      render(
        <ClusterMonitoringTable
          clusterMonitoring={[row] as any}
          applicationId="app-1"
          setSelectedMonitoring={setSelectedMonitoring}
          isReader={false}
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          setDisplayAddEditModal={setDisplayAddEditModal}
          setEditingMonitoring={setEditingMonitoring}
          setApproveRejectModal={setApproveRejectModal}
          selectedRows={[]}
          setSelectedRows={setSelectedRows}
          setDuplicatingData={setDuplicatingData}
          setClusterMonitoring={vi.fn()}
        />
      );

      return {
        expectView: () => {
          expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
        },
        expectEdit: () => {
          expect(setEditingMonitoring).toHaveBeenCalledWith(true);
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
        },
        expectApprove: () => {
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setApproveRejectModal).toHaveBeenCalledWith(true);
        },
        expectDuplicate: () => {
          expect(setDuplicatingData).toHaveBeenCalledWith({ isDuplicating: true, selectedMonitoring: row });
          expect(setSelectedMonitoring).toHaveBeenCalledWith(row);
          expect(setDisplayAddEditModal).toHaveBeenCalledWith(true);
        },
        expectSelection: () => {
          expect(setSelectedRows).toHaveBeenCalledWith([row]);
        },
      };
    },
  },
];

describe('Monitoring tables shared behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      application: {
        application: { applicationId: 'app-1' },
        integrations: [{ name: 'ASR', application_id: 'app-1' }],
      },
    };
  });

  describe.each(monitoringCases)('$name monitoring table', monitoringCase => {
    it('wires shared row actions', async () => {
      const user = userEvent.setup();
      const context = monitoringCase.renderTable();

      await runCommonTableActions(user, {
        onView: context.expectView,
        onEdit: context.expectEdit,
        onApproveReject: context.expectApprove,
        onDuplicate: context.expectDuplicate,
      });
    });

    it('wires row selection callback', async () => {
      const user = userEvent.setup();
      const context = monitoringCase.renderTable();

      await clickSelectFirstRow(user);
      context.expectSelection();
    });
  });
});
