/* eslint-env jest */
/* eslint-disable prettier/prettier */
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock antd message
vi.mock('antd', () => ({ message: { error: vi.fn() } }));

const mockGetMonitoringTypeId = vi.fn();
vi.mock('@/components/common/ASRTools', () => ({
  getMonitoringTypeId: (...args) => mockGetMonitoringTypeId(...args),
}));

import { message } from 'antd';
import { useMonitorType } from '@/hooks/useMonitoringType';

describe('useMonitoringType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches monitoring type id by name', async () => {
    mockGetMonitoringTypeId.mockResolvedValueOnce('type-42');
    const { result } = renderHook(() => useMonitorType('Job Monitoring'));
    await waitFor(() => result.current.monitoringTypeId === 'type-42');
    expect(result.current.monitoringTypeId).toBe('type-42');
    expect(mockGetMonitoringTypeId).toHaveBeenCalledWith({ monitoringTypeName: 'Job Monitoring' });
  });

  it('handles error by showing message.error', async () => {
    mockGetMonitoringTypeId.mockRejectedValueOnce(new Error('nope'));
    renderHook(() => useMonitorType('Any'));
    await waitFor(() => message.error.mock.calls.some((call) => call[0] === 'Error fetching monitoring type ID'));
  });
});
