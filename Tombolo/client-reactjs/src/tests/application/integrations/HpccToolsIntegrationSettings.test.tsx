import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HpccToolsIntegrationSettings from '@/components/admin/Integrations/hpcc-tools';

vi.mock('@/components/common/BreadCrumbs', () => ({
  default: () => <div data-testid="breadcrumbs" />,
}));

const mockTriggerHpccToolsManualSync = vi.fn();
vi.mock('@/services/integrations.service', () => ({
  default: {
    triggerHpccToolsManualSync: (...args: any[]) => mockTriggerHpccToolsManualSync(...args),
  },
}));

const mockHandleSuccess = vi.fn();
const mockHandleError = vi.fn();
vi.mock('@/components/common/handleResponse', () => ({
  handleSuccess: (...args: any[]) => mockHandleSuccess(...args),
  handleError: (...args: any[]) => mockHandleError(...args),
}));

describe('HpccToolsIntegrationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queues manual sync for mapped integration', async () => {
    const user = userEvent.setup();
    mockTriggerHpccToolsManualSync.mockResolvedValue({ success: true });

    render(<HpccToolsIntegrationSettings integration_to_app_mapping_id="map-123" />);

    await user.click(screen.getByRole('button', { name: 'Sync Now' }));

    await waitFor(() => {
      expect(mockTriggerHpccToolsManualSync).toHaveBeenCalledWith({ integrationMappingId: 'map-123' });
    });
    expect(mockHandleSuccess).toHaveBeenCalledWith('HPCC Tools sync job queued');
  });

  it('shows error when mapping id is missing', async () => {
    const user = userEvent.setup();

    render(<HpccToolsIntegrationSettings />);

    await user.click(screen.getByRole('button', { name: 'Sync Now' }));

    expect(mockTriggerHpccToolsManualSync).not.toHaveBeenCalled();
    expect(mockHandleError).toHaveBeenCalledWith('HPCC Tools integration mapping is missing for this application');
  });

  it('shows error when sync request fails', async () => {
    const user = userEvent.setup();
    mockTriggerHpccToolsManualSync.mockRejectedValue(new Error('failed'));

    render(<HpccToolsIntegrationSettings integration_to_app_mapping_id="map-456" />);

    await user.click(screen.getByRole('button', { name: 'Sync Now' }));

    await waitFor(() => {
      expect(mockHandleError).toHaveBeenCalledWith('Failed to queue HPCC Tools sync job');
    });
  });
});
