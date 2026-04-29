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

vi.mock('@/components/application/fileMonitoring/FileMonitoringBasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/fileMonitoring/FileMonitoringNotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditFileMonitoringModal from '@/components/application/fileMonitoring/AddEditFileMonitoringModal';

describe('AddEditFileMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddFileMonitoringModal: true,
      handleSaveFileMonitoring: vi.fn(),
      handleUpdateFileMonitoring: vi.fn(),
      clusters: [],
      savingFileMonitoring: false,
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      setErroneousTabs: vi.fn(),
      handleClusterChange: vi.fn(),
      fileMonitoring: [],
      domains: [],
      productCategories: [],
      selectedClusters: [],
      setSelectedDomain: vi.fn(),
      selectedNotificationCondition: [],
      setSelectedNotificationCondition: vi.fn(),
      monitoringFileType: 'stdLogicalFile',
      setMonitoringFileType: vi.fn(),
    };
  });

  it('renders modal and allows navigation; Cancel resets state', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditFileMonitoringModal {...makeProps()} />);

    await assertFirstTabNavigationFlow({
      user,
      nextTab: '1',
      setActiveTabSpy: baseProps.setActiveTab,
      cancelAction: () => user.click(screen.getByText('Cancel')),
    });

    expect(baseProps.resetStates).toHaveBeenCalled();
  });

  it('shows Submit on last tab when not editing; Update when editing', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditFileMonitoringModal {...makeProps()} />);

    await assertControlledFinalTabActionFlow({
      user,
      rerender,
      renderModal: overrides => <AddEditFileMonitoringModal {...makeProps(overrides)} />,
      lastTab: '1',
      saveLabel: 'Submit',
      updateLabel: 'Update',
      saveSpy: baseProps.handleSaveFileMonitoring,
      updateSpy: baseProps.handleUpdateFileMonitoring,
    });
  });
});
