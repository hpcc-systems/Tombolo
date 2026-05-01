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
const mockToggleStatus = vi.fn();
const mockDelete = vi.fn();
vi.mock('@/services/orbitProfileMonitoring.service', () => ({
  default: {
    toggleStatus: (...args) => mockToggleStatus(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));
import OrbitMonitoringTable from '@/components/application/orbitProfileMonitoring/OrbitMonitoringTable';
import { clickSelectFirstRow, runCommonTableActions } from '@/tests/application/testUtils/tableAssertions';
const OrbitMonitoringTableAny = OrbitMonitoringTable as any;

const rowApproved = {
  id: '1',
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
      <OrbitMonitoringTableAny
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

    await runCommonTableActions(user, {
      onView: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setDisplayViewDetailsModal).toHaveBeenCalledWith(true);
      },
      onEdit: () => {
        expect(onEdit).toHaveBeenCalledWith(rowApproved);
      },
      onApproveReject: () => {
        expect(setSelectedMonitoring).toHaveBeenCalledWith(rowApproved);
        expect(setApproveRejectModal).toHaveBeenCalledWith(true);
      },
      onDuplicate: () => {
        expect(onCopy).toHaveBeenCalledWith(rowApproved);
      },
    });
  });

  it('performs toggle when pause/start is clicked', async () => {
    const user = userEvent.setup();
    const onToggleStatus = vi.fn();

    render(
      <OrbitMonitoringTableAny
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
      <OrbitMonitoringTableAny
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

    await clickSelectFirstRow(user);
    expect(setSelectedRows).toHaveBeenCalled();
  });
});
