/* eslint-env jest */
/* eslint-disable prettier/prettier */
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock antd with both message and notification
vi.mock('antd', () => ({
  message: { error: vi.fn() },
  notification: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

// Mock asrService functions
const mockGetDomains = vi.fn();
const mockGetProductCategories = vi.fn();
vi.mock('@/services/asr.service', () => ({
  default: {
    getDomains: (...args) => mockGetDomains(...args),
    getProductCategories: (...args) => mockGetProductCategories(...args),
  },
}));

import { message } from 'antd';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';

describe('useDomainAndCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state with empty arrays and nulls', () => {
    const { result } = renderHook(() => useDomainAndCategories(undefined, null));
    expect(result.current.domains).toEqual([]);
    expect(result.current.selectedDomain).toBe(null);
    expect(result.current.productCategories).toEqual([]);
  });

  it('allows manual setting of domains and product categories', () => {
    const { result } = renderHook(() => useDomainAndCategories(undefined, null));
    act(() => {
      result.current.setDomains([{ label: 'Manual Domain', value: 'manual' }]);
      result.current.setProductCategories([{ label: 'Manual Category', value: 'cat1' }]);
    });
    expect(result.current.domains).toEqual([{ label: 'Manual Domain', value: 'manual' }]);
    expect(result.current.productCategories).toEqual([{ label: 'Manual Category', value: 'cat1' }]);
  });

  it('updates domains when monitoringTypeId changes', async () => {
    mockGetDomains.mockResolvedValueOnce([{ id: 'd3', name: 'Domain Three' }]);
    const { result, rerender } = renderHook(({ typeId }) => useDomainAndCategories(typeId, null), {
      initialProps: { typeId: undefined },
    });
    expect(result.current.domains).toEqual([]);
    rerender({ typeId: 'mt-555' });
    await waitFor(() => result.current.domains.length === 1);
    expect(result.current.domains).toEqual([{ label: 'Domain Three', value: 'd3' }]);
  });

  it('updates selectedDomain when selectedMonitoring changes', async () => {
    const { result, rerender } = renderHook(({ monitoring }) => useDomainAndCategories('mt-1', monitoring), {
      initialProps: { monitoring: null },
    });
    expect(result.current.selectedDomain).toBe(null);
    const newMonitoring = { metaData: { asrSpecificMetaData: { domain: 'd9' } } };
    rerender({ monitoring: newMonitoring });
    await waitFor(() => result.current.selectedDomain === 'd9');
    expect(result.current.selectedDomain).toBe('d9');
  });

  it('fetches domains when monitoringTypeId is provided and maps to label/value', async () => {
    mockGetDomains.mockResolvedValueOnce([
      { id: 'd1', name: 'Domain One' },
      { id: 'd2', name: 'Domain Two' },
    ]);
    const { result } = renderHook(() => useDomainAndCategories('mt-123', null));
    await waitFor(() => result.current.domains.length === 2);
    expect(result.current.domains).toEqual([
      { label: 'Domain One', value: 'd1' },
      { label: 'Domain Two', value: 'd2' },
    ]);
    expect(message.error).not.toHaveBeenCalled();
  });

  it('does not fetch domains when monitoringTypeId is falsy', async () => {
    const { result } = renderHook(() => useDomainAndCategories(undefined, null));
    await waitFor(() => result.current.domains.length === 0);
    expect(result.current.domains).toEqual([]);
    expect(mockGetDomains).not.toHaveBeenCalled();
  });

  it('sets selectedDomain from selectedMonitoring metaData', async () => {
    const selectedMonitoring = { metaData: { asrSpecificMetaData: { domain: 'd7' } } };
    const { result } = renderHook(({ monitoring, typeId }) => useDomainAndCategories(typeId, monitoring), {
      initialProps: { monitoring: selectedMonitoring, typeId: 'any' },
    });
    await waitFor(() => result.current.selectedDomain === 'd7');
    expect(result.current.selectedDomain).toBe('d7');
  });

  it('fetches product categories when selectedDomain changes and maps to label/value', async () => {
    mockGetProductCategories.mockResolvedValueOnce([
      { id: 'p1', name: 'Alpha', shortCode: 'A' },
      { id: 'p2', name: 'Beta', shortCode: 'B' },
    ]);
    const { result } = renderHook(() => useDomainAndCategories('mt-1', null));
    act(() => {
      result.current.setSelectedDomain('d1');
    });
    await waitFor(() => result.current.productCategories.length === 2);
    expect(mockGetProductCategories).toHaveBeenCalledWith({ domainId: 'd1' });
    expect(result.current.productCategories).toEqual([
      { label: 'A - Alpha', value: 'p1' },
      { label: 'B - Beta', value: 'p2' },
    ]);
  });

  it('handles errors by showing message.error for domains and product categories', async () => {
    mockGetDomains.mockRejectedValueOnce(new Error('boom'));
    renderHook(() => useDomainAndCategories('mt-err', null));
    await waitFor(() => message.error.mock.calls.some((call) => call[0] === 'Error fetching domains'));
    // Now test product categories error
    mockGetProductCategories.mockRejectedValueOnce(new Error('boom2'));
    const { result } = renderHook(() => useDomainAndCategories('mt-1', null));
    act(() => {
      result.current.setSelectedDomain('d2');
    });
    await waitFor(() => message.error.mock.calls.some((call) => call[0] === 'Error fetching product category'));
  });
});
