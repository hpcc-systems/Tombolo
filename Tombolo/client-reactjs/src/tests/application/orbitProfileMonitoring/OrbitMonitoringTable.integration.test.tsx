import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-router-dom', () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));

let mockState: any = {};
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(mockState),
}));

import OrbitMonitoringTable from '@/components/application/orbitProfileMonitoring/OrbitMonitoringTable';

describe('OrbitMonitoringTable integration', () => {
  const row = {
    id: '1',
    monitoringName: 'Orbit Mon A',
    description: 'desc',
    approvalStatus: 'approved',
    isActive: true,
    metaData: { asrSpecificMetaData: { buildName: 'Build123' }, notificationConditions: ['condition1'] },
    creator: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
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

  it('opens popover actions and triggers duplicate and row selection with minimal mocks', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const setSelectedRows = vi.fn();

    render(
      <OrbitMonitoringTable
        orbitMonitoringData={[row] as any}
        setSelectedMonitoring={vi.fn()}
        setDisplayViewDetailsModal={vi.fn()}
        setApproveRejectModal={vi.fn()}
        onEdit={vi.fn()}
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

    await user.click(screen.getByText('More'));
    await user.click(await screen.findByText('Duplicate'));
    expect(onCopy).toHaveBeenCalledWith(row);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await waitFor(() => expect(setSelectedRows).toHaveBeenCalled());
  });
});
