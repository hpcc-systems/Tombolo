/* eslint-env jest */
/* eslint-disable prettier/prettier */
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

// We will mock debounce to execute immediately to simplify timing behavior
vi.mock('lodash/debounce', () => ({ default: (fn) => fn }));

// Mock localStorage
const store = new Map();
const localStorageMock = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import useMonitoringFilters from '@/hooks/useMonitoringFilters';

describe('useMonitoringFilters', () => {
  const lsKey = 'filters-key';
  const visibleLsKey = 'filters-visible';

  const createForm = (initial = {}) => {
    const values = { ...initial };
    return {
      setFieldsValue: (patch) => Object.assign(values, patch),
      getFieldsValue: () => ({ ...values }),
      resetFields: () => {
        Object.keys(values).forEach((k) => delete values[k]);
      },
    };
  };

  beforeEach(() => {
    store.clear();
  });

  it('loads visibility and existing filters from localStorage and calculates filterCount', () => {
    store.set(visibleLsKey, 'true');
    store.set(lsKey, JSON.stringify({ a: 1, b: 0, c: 'x' })); // truthy: a,c -> 2

    const form = createForm();
    const setFiltersVisible = vi.fn();
    const setFilters = vi.fn();
    const setSelectedDomain = vi.fn();

    const { result } = renderHook(() =>
      useMonitoringFilters(
        form,
        setFiltersVisible,
        setFilters,
        setSelectedDomain,
        [],
        [],
        null,
        [],
        lsKey,
        visibleLsKey
      )
    );

    expect(setFiltersVisible).toHaveBeenCalledWith(true);
    expect(result.current.filterCount).toBe(2);
  });

  it('handleFormChange persists filters, updates filterCount and calls setFilters', () => {
    const form = createForm({ foo: 'bar' });
    const setFiltersVisible = vi.fn();
    const setFilters = vi.fn();
    const setSelectedDomain = vi.fn();

    const { result } = renderHook(() =>
      useMonitoringFilters(
        form,
        setFiltersVisible,
        setFilters,
        setSelectedDomain,
        [],
        [],
        null,
        [],
        lsKey,
        visibleLsKey
      )
    );

    act(() => {
      result.current.handleFormChange();
    });
    expect(setFilters).toHaveBeenCalledWith({ foo: 'bar' });
    expect(JSON.parse(store.get(lsKey))).toEqual({ foo: 'bar' });
    expect(result.current.filterCount).toBe(1);
  });

  it('handleDomainChange sets selected domain and clears product field', () => {
    const form = createForm({ product: 'p1', other: 1 });
    const setSelectedDomain = vi.fn();

    const { result } = renderHook(() =>
      useMonitoringFilters(form, vi.fn(), vi.fn(), setSelectedDomain, [], [], null, [], lsKey, visibleLsKey)
    );

    act(() => {
      result.current.handleDomainChange('d1');
    });
    expect(setSelectedDomain).toHaveBeenCalledWith('d1');
    expect(form.getFieldsValue().product).toBe('');
  });

  it('handleFilterCountClick sets filters visible', () => {
    const setFiltersVisible = vi.fn();
    const { result } = renderHook(() =>
      useMonitoringFilters(
        {
          setFieldsValue() {},
          getFieldsValue() {
            return {};
          },
          resetFields() {},
        },
        setFiltersVisible,
        vi.fn(),
        vi.fn(),
        [],
        [],
        null,
        [],
        lsKey,
        visibleLsKey
      )
    );

    act(() => {
      result.current.handleFilterCountClick();
    });
    expect(setFiltersVisible).toHaveBeenCalledWith(true);
  });

  it('clearFilters resets form, count, parent filters and removes from localStorage', () => {
    store.set(lsKey, JSON.stringify({ x: 1 }));
    const form = createForm({ x: 1 });
    const setFilters = vi.fn();

    const { result } = renderHook(() =>
      useMonitoringFilters(form, vi.fn(), setFilters, vi.fn(), [], [], null, [], lsKey, visibleLsKey)
    );

    act(() => {
      result.current.clearFilters();
    });
    expect(form.getFieldsValue()).toEqual({});
    expect(result.current.filterCount).toBe(0);
    expect(setFilters).toHaveBeenCalledWith({});
    expect(store.get(lsKey)).toBeUndefined();
  });

  it('loadFilters builds options from monitorings with and without selectedDomain', () => {
    const domains = [
      { value: 'd1', label: 'Domain 1' },
      { value: 'd2', label: 'Domain 2' },
    ];
    const allProductCategories = [
      { id: 'p1', name: 'Prod 1' },
      { id: 'p2', name: 'Prod 2' },
    ];
    const productCategories = [
      { value: 'p1', label: 'P1 - Prod 1' },
      { value: 'p2', label: 'P2 - Prod 2' },
    ];

    const form = createForm();

    // Case A: no selectedDomain -> should use allProductCategories
    const { result: resA } = renderHook(() =>
      useMonitoringFilters(
        form,
        vi.fn(),
        vi.fn(),
        vi.fn(),
        domains,
        productCategories,
        null,
        allProductCategories,
        lsKey,
        visibleLsKey
      )
    );

    const monitorings = [
      {
        approvalStatus: 'Approved',
        isActive: true,
        metaData: { asrSpecificMetaData: { domain: 'd1', productCategory: 'p1' } },
      },
      {
        approvalStatus: 'Pending',
        isActive: false,
        metaData: { asrSpecificMetaData: { domain: 'd2', productCategory: 'p2' } },
      },
    ];

    const makeBase = () => ({ approvalStatus: [], activeStatus: [], domain: [], products: [] });
    const builtA = resA.current.loadFilters(makeBase(), monitorings);

    expect(builtA.approvalStatus.sort()).toEqual(['Approved', 'Pending']);
    expect(builtA.activeStatus.sort()).toEqual(['Active', 'Inactive']);
    expect(builtA.domain).toEqual([
      { id: 'd1', name: 'Domain 1' },
      { id: 'd2', name: 'Domain 2' },
    ]);
    expect(builtA.products).toEqual([
      { id: 'p1', name: 'Prod 1' },
      { id: 'p2', name: 'Prod 2' },
    ]);

    // Case B: with selectedDomain -> should use productCategories labels
    const { result: resB } = renderHook(() =>
      useMonitoringFilters(
        form,
        vi.fn(),
        vi.fn(),
        vi.fn(),
        domains,
        productCategories,
        'd1',
        allProductCategories,
        lsKey,
        visibleLsKey
      )
    );

    const builtB = resB.current.loadFilters(makeBase(), monitorings);
    expect(builtB.products).toEqual([
      { id: 'p1', name: 'P1 - Prod 1' },
      { id: 'p2', name: 'P2 - Prod 2' },
    ]);
  });
});
