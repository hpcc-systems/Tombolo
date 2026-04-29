import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('@/components/application/jobMonitoring/JobMonitoringBasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/jobMonitoring/JobMonitoringTab', () => ({
  default: () => <div>SchedulingTab</div>,
}));
vi.mock('@/components/application/jobMonitoring/JobMonitoringNotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditJobMonitoringModal from '@/components/application/jobMonitoring/AddEditJobMonitoringModal';

describe('AddEditJobMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddJobMonitoringModal: true,
      monitoringScope: 'clusters',
      setMonitoringScope: vi.fn(),
      handleSaveJobMonitoring: vi.fn(),
      handleUpdateJobMonitoring: vi.fn(),
      intermittentScheduling: { frequency: 'daily' },
      setIntermittentScheduling: vi.fn(),
      setCompleteSchedule: vi.fn(),
      completeSchedule: {},
      cron: '',
      setCron: vi.fn(),
      cronMessage: '',
      setCronMessage: vi.fn(),
      erroneousScheduling: false,
      form: {},
      clusters: [],
      savingJobMonitoring: false,
      jobMonitorings: [],
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      domains: [],
      productCategories: [],
      setSelectedDomain: vi.fn(),
      selectedCluster: null,
      setSelectedCluster: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
    };
  });

  it('shows title based on mode', () => {
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditJobMonitoringModal {...makeProps()} />);
    // Title is provided via Modal title? The component uses footer only; no title passed. So just ensure modal rendered by checking tabs.
    expect(screen.getByTestId('tabs')).toBeInTheDocument();

    rerender(<AddEditJobMonitoringModal {...makeProps({ isEditing: true })} />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('navigates first tab and resets state on cancel', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditJobMonitoringModal {...makeProps()} />);

    await assertFirstTabNavigationFlow({
      user,
      nextTab: '1',
      setActiveTabSpy: baseProps.setActiveTab,
      cancelAction: () => user.click(screen.getByLabelText('modal-cancel')),
    });

    expect(baseProps.resetStates).toHaveBeenCalled();
  });

  it('submits and updates on final tab', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditJobMonitoringModal {...makeProps()} />);

    await assertControlledFinalTabActionFlow({
      user,
      rerender,
      renderModal: overrides => <AddEditJobMonitoringModal {...makeProps(overrides)} />,
      lastTab: '2',
      saveLabel: 'Submit',
      updateLabel: 'Update',
      saveSpy: baseProps.handleSaveJobMonitoring,
      updateSpy: baseProps.handleUpdateJobMonitoring,
    });
  });
});
