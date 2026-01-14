/* eslint-env jest */
/* eslint-disable prettier/prettier */
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

// Mock antd with both message and notification
vi.mock('antd', () => ({
  message: { error: vi.fn() },
  notification: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const mockGetAllProductCategories = vi.fn();
vi.mock('@/services/asr.service', () => ({
  default: {
    getAllProductCategories: (...args) => mockGetAllProductCategories(...args),
  },
}));

// Use real flattenObject from the module to ensure behavior alignment
import { flattenObject } from '@/components/common/CommonUtil.jsx';
import { message } from 'antd';
import { useMonitoringsAndAllProductCategories } from '@/hooks/useMonitoringsAndAllProductCategories';

describe('useMonitoringsAndAllProductCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches monitorings via provided function and product categories; handles array response', async () => {
    const getAllMonitorings = vi.fn().mockResolvedValueOnce([{ id: 'm1', name: 'Mon1', metaData: { a: 1 } }]);
    mockGetAllProductCategories.mockResolvedValueOnce([{ id: 'p1', name: 'Prod1' }]);

    const { result } = renderHook(() => useMonitoringsAndAllProductCategories('app-1', getAllMonitorings));

    // Wait for monitorings to be set
    await waitFor(() => result.current.monitorings.length === 1);
    expect(result.current.monitorings[0].id).toBe('m1');

    // Wait for product categories to be set
    await waitFor(() => result.current.allProductCategories.length === 1);
    expect(result.current.allProductCategories).toEqual([{ id: 'p1', name: 'Prod1' }]);
  });

  it('supports flatten option by merging flattenObject result into monitoring', async () => {
    const nested = { id: 'm2', metaData: { inner: { x: 10 } } };
    const getAllMonitorings = vi.fn().mockResolvedValueOnce([nested]);
    mockGetAllProductCategories.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useMonitoringsAndAllProductCategories('app-1', getAllMonitorings, true));

    await waitFor(() => result.current.monitorings.length === 1);
    const flat = flattenObject(nested);
    expect(result.current.monitorings[0]).toEqual({ ...flat, ...nested });
  });

  it('handles non-array response shape with data field', async () => {
    const getAllMonitorings = vi.fn().mockResolvedValueOnce({ data: [{ id: 'm3' }] });
    mockGetAllProductCategories.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useMonitoringsAndAllProductCategories('app-2', getAllMonitorings));

    await waitFor(() => result.current.monitorings.length === 1);
    expect(result.current.monitorings).toEqual([{ id: 'm3' }]);
  });

  it('shows error messages on failures', async () => {
    const getAllMonitorings = vi.fn().mockRejectedValueOnce(new Error('fail m'));
    mockGetAllProductCategories.mockRejectedValueOnce(new Error('fail p'));

    renderHook(() => useMonitoringsAndAllProductCategories('app-err', getAllMonitorings));

    await waitFor(() => message.error.mock.calls.some((call) => call[0] === 'Error fetching job monitorings'));
    await waitFor(() =>
      message.error.mock.calls.some((call) => call[0] === 'Error fetching list of all products categories')
    );
  });

  it('does not fetch monitorings when applicationId is missing', async () => {
    const getAllMonitorings = vi.fn();
    await act(async () => {
      renderHook(() => useMonitoringsAndAllProductCategories(undefined, getAllMonitorings));
    });
    expect(getAllMonitorings).not.toHaveBeenCalled();
  });
});
