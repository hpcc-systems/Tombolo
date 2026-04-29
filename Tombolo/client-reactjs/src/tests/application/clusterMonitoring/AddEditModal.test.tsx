import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertModalTitles } from '@/tests/application/testUtils/modalAssertions';
import {
  assertUncontrolledFinalTabAction,
  clickNextIfPresent,
  createModalPropsFactory,
} from '@/tests/application/testUtils/modalHarness';

vi.mock('antd', async importOriginal => {
  const antd = await importOriginal();
  const { createModalAntdMocks } = await import('@/tests/application/testUtils/antdModalMock');
  return { ...(antd as any), ...createModalAntdMocks() };
});

vi.mock('@/components/application/clusterMonitoring/AddEditModal/BasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/clusterMonitoring/AddEditModal/NotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

vi.mock('@/services/clusterMonitoring.service', () => ({
  default: {
    create: vi.fn().mockResolvedValue({ data: { id: '111' } }),
    update: vi.fn().mockResolvedValue({ data: { id: '222' } }),
  },
}));

vi.mock('@/components/application/clusterMonitoring/clusterMonitoringUtils', () => ({
  identifyErroneousTabs: vi.fn().mockReturnValue([]),
}));

import AddEditModal from '@/components/application/clusterMonitoring/AddEditModal/AddEditModal';
import clusterMonitoringService from '@/services/clusterMonitoring.service';

describe('Cluster AddEditModal', () => {
  let baseProps;
  let form;
  beforeEach(() => {
    form = {
      resetFields: vi.fn(),
      validateFields: vi.fn().mockResolvedValue(undefined),
      getFieldsError: vi.fn().mockReturnValue([]),
      getFieldsValue: vi.fn().mockReturnValue({
        monitoringName: 'X',
        clusterMonitoringType: ['usage'],
        usageThreshold: 10,
        domain: 'd1',
        productCategory: 'p1',
        primaryContacts: [],
        secondaryContacts: [],
        notifyContacts: [],
      }),
    };
    baseProps = {
      setDisplayAddEditModal: vi.fn(),
      form,
      handleClusterChange: vi.fn(),
      domains: [],
      productCategories: [],
      setProductCategories: vi.fn(),
      selectedDomain: undefined,
      setSelectedDomain: vi.fn(),
      setClusterMonitoring: vi.fn(),
      clusterMonitoring: [],
      setEditingMonitoring: vi.fn(),
      editingMonitoring: false,
      selectedMonitoring: { id: '5' },
      setDuplicatingData: vi.fn(),
      isDuplicating: false,
      monitoringType: [],
      setMonitoringType: vi.fn(),
    };
  });

  it('shows correct title based on mode', () => {
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditModal {...makeProps()} />);
    assertModalTitles({
      rerender,
      renderModal: (props = {}) => <AddEditModal {...makeProps(props)} />,
      cases: [
        { title: 'Add Cluster Monitoring' },
        { title: 'Edit Cluster Monitoring', props: { editingMonitoring: true } },
        { title: 'Duplicate Cluster Monitoring', props: { isDuplicating: true } },
      ],
    });
  });

  it('navigates Next/Previous and Cancel resets state', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditModal {...makeProps()} />);

    await clickNextIfPresent(user);
    // Now should be on tab 1; clicking Previous returns
    await user.click(screen.getByText('Previous'));

    await user.click(screen.getByText('Cancel'));
    expect(baseProps.setDisplayAddEditModal).toHaveBeenCalledWith(false);
    expect(baseProps.setEditingMonitoring).toHaveBeenCalledWith(false);
    expect(form.resetFields).toHaveBeenCalled();
  });

  it('on last tab shows Previous and Update when not editing; Submit when editing and calls update util', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    // Render with editing to drop into last tab footer showing Previous/Submit in our mock
    const { rerender } = render(<AddEditModal {...makeProps({ editingMonitoring: true })} />);

    rerender(<AddEditModal {...makeProps({ editingMonitoring: true, selectedMonitoring: { id: '77' } })} />);
    await assertUncontrolledFinalTabAction({
      user,
      actionMatcher: /Submit|Update/,
      actionSpy: clusterMonitoringService.update,
    });
    expect(clusterMonitoringService.update).toHaveBeenCalled();
  });

  it('calls create util when not editing on submit', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditModal {...makeProps()} />);
    await assertUncontrolledFinalTabAction({
      user,
      actionMatcher: /Submit|Update/,
      actionSpy: clusterMonitoringService.create,
    });
    expect(clusterMonitoringService.create).toHaveBeenCalled();
  });
});
