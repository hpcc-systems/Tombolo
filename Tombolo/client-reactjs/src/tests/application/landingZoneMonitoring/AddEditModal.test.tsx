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

vi.mock('@/components/application/LandingZoneMonitoring/AddEditModal/BasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/LandingZoneMonitoring/AddEditModal/MonitoringTab', () => ({
  default: () => <div>MonitoringTab</div>,
}));
vi.mock('@/components/application/LandingZoneMonitoring/AddEditModal/NotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditModal from '@/components/application/LandingZoneMonitoring/AddEditModal/Modal';

describe('LandingZone AddEditModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddEditModal: true,
      setDisplayAddEditModal: vi.fn(),
      handleSaveLzmonitoring: vi.fn(),
      handleUpdateLzMonitoring: vi.fn(),
      form: {},
      clusters: [],
      isEditing: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      selectedCluster: null,
      setSelectedCluster: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      directory: '',
      setDirectory: vi.fn(),
      copying: false,
      setCopying: vi.fn(),
      selectedMonitoring: null,
      domains: [],
      productCategories: [],
      setSelectedDomain: vi.fn(),
      lzMonitoringType: null,
      setLzMonitoringType: vi.fn(),
      landingZoneMonitoring: [],
      setMinSizeThresholdUnit: vi.fn(),
      setMaxSizeThresholdUnit: vi.fn(),
      minSizeThresholdUnit: 'MB',
      maxSizeThresholdUnit: 'MB',
    };
  });

  it('renders modal and tabs; title reflects mode', () => {
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditModal {...makeProps()} />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();

    assertModalTitles({
      rerender,
      renderModal: (props = {}) => <AddEditModal {...makeProps(props)} />,
      cases: [
        { title: 'Add Landing Zone Monitoring' },
        { title: 'Edit Landing Zone Monitoring', props: { isEditing: true } },
      ],
    });
  });

  it('navigates first tab and resets on cancel', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditModal {...makeProps()} />);

    await assertFirstTabNavigationFlow({
      user,
      nextTab: '1',
      setActiveTabSpy: baseProps.setActiveTab,
      cancelAction: () => user.click(screen.getByLabelText('modal-cancel')),
    });

    expect(baseProps.resetStates).toHaveBeenCalled();
    expect(baseProps.setCopying).toHaveBeenCalledWith(false);
    expect(baseProps.setLzMonitoringType).toHaveBeenCalledWith(null);
  });

  it('submits and updates on final tab', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditModal {...makeProps()} />);

    await assertControlledFinalTabActionFlow({
      user,
      rerender,
      renderModal: overrides => <AddEditModal {...makeProps(overrides)} />,
      lastTab: '2',
      saveLabel: 'Submit',
      updateLabel: 'Update',
      saveSpy: baseProps.handleSaveLzmonitoring,
      updateSpy: baseProps.handleUpdateLzMonitoring,
    });
  });
});
