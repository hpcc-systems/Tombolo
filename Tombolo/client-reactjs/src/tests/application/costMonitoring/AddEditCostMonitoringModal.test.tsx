import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertModalTitles } from '@/tests/application/testUtils/modalAssertions';
import {
  assertControlledFinalTabActionFlow,
  assertFirstTabNavigationFlow,
  createModalPropsFactory,
} from '@/tests/application/testUtils/modalHarness';

vi.mock('antd', async importOriginal => {
  const antd = await importOriginal();
  const { createModalAntdMocks } = await import('@/tests/application/testUtils/antdModalMock');
  return { ...(antd as any), ...createModalAntdMocks() };
});

// Stub child tabs
vi.mock('@/components/application/costMonitoring/CostMonitoringBasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/costMonitoring/CostMonitoringNotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditCostMonitoringModal from '@/components/application/costMonitoring/AddEditCostMonitoringModal';

describe('AddEditCostMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddCostMonitoringModal: true,
      handleSaveCostMonitoring: vi.fn(),
      handleUpdateCostMonitoring: vi.fn(),
      form: {},
      clusters: [],
      savingCostMonitoring: false,
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      setErroneousTabs: vi.fn(),
      handleClusterChange: vi.fn(),
      costMonitorings: [],
      domains: [],
      productCategories: [],
      selectedClusters: [],
      setSelectedDomain: vi.fn(),
    };
  });

  it('shows correct title based on mode', () => {
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditCostMonitoringModal {...makeProps()} />);
    assertModalTitles({
      rerender,
      renderModal: (props = {}) => <AddEditCostMonitoringModal {...makeProps(props)} />,
      cases: [
        { title: 'Add Cost Monitoring' },
        { title: 'Edit Cost Monitoring', props: { isEditing: true } },
        { title: 'Duplicate Cost Monitoring', props: { isDuplicating: true } },
      ],
    });
  });

  it('renders Next/Cancel on first tab and navigates on Next; Cancel resets', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditCostMonitoringModal {...makeProps()} />);

    await assertFirstTabNavigationFlow({
      user,
      nextTab: '1',
      setActiveTabSpy: baseProps.setActiveTab,
      cancelAction: () => user.click(screen.getByText('Cancel')),
    });

    expect(baseProps.resetStates).toHaveBeenCalled();
  });

  it('renders Previous and Submit on last tab when not editing; shows Update when editing', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditCostMonitoringModal {...makeProps()} />);

    await assertControlledFinalTabActionFlow({
      user,
      rerender,
      renderModal: overrides => <AddEditCostMonitoringModal {...makeProps(overrides)} />,
      lastTab: '1',
      saveLabel: 'Submit',
      updateLabel: 'Update',
      saveSpy: baseProps.handleSaveCostMonitoring,
      updateSpy: baseProps.handleUpdateCostMonitoring,
    });
  });
});
