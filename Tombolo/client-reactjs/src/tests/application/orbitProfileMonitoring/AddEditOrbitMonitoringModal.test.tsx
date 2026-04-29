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
vi.mock('@/components/application/orbitProfileMonitoring/AddEditModal/BasicTab', () => ({
  default: () => <div>BasicTab</div>,
}));
vi.mock('@/components/application/orbitProfileMonitoring/AddEditModal/AsrTab', () => ({
  default: () => <div>AsrTab</div>,
}));
vi.mock('@/components/application/orbitProfileMonitoring/AddEditModal/NotificationTab', () => ({
  default: () => <div>NotificationTab</div>,
}));

import AddEditModal from '@/components/application/orbitProfileMonitoring/AddEditModal/Modal';

describe('AddEditOrbitMonitoringModal', () => {
  let baseProps;
  beforeEach(() => {
    baseProps = {
      displayAddEditModal: true,
      saveOrbitMonitoring: vi.fn(),
      form: {
        validateFields: vi.fn().mockResolvedValue(undefined),
        getFieldsValue: vi.fn().mockReturnValue({}),
        setFieldsValue: vi.fn(),
        setFields: vi.fn(),
        resetFields: vi.fn(),
      },
      savingOrbitMonitoring: false,
      isEditing: false,
      isDuplicating: false,
      erroneousTabs: [],
      resetStates: vi.fn(),
      activeTab: '0',
      setActiveTab: vi.fn(),
      setErroneousTabs: vi.fn(),
      setDisplayAddEditModal: vi.fn(),
      orbitMonitoringData: [],
      domains: [],
      productCategories: [],
      setSelectedDomain: vi.fn(),
      selectedMonitoring: null,
      applicationId: 'app-1',
      selectedDomain: null,
    };
  });

  it('shows correct title based on mode', () => {
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditModal {...makeProps()} />);
    assertModalTitles({
      rerender,
      renderModal: (props = {}) => <AddEditModal {...makeProps(props)} />,
      cases: [
        { title: 'Add Orbit Monitoring' },
        { title: 'Edit Orbit Monitoring', props: { isEditing: true } },
        { title: 'Duplicate Orbit Monitoring', props: { isDuplicating: true } },
      ],
    });
  });

  it('renders Next/Cancel on first tab and navigates on Next; Cancel resets', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    render(<AddEditModal {...makeProps()} />);

    await assertFirstTabNavigationFlow({
      user,
      nextTab: '1',
      setActiveTabSpy: baseProps.setActiveTab,
      assertCancelResetsToFirstTab: false,
      cancelAction: () => user.click(screen.getByText('Cancel')),
    });

    expect(baseProps.resetStates).toHaveBeenCalled();
  });

  it('renders Previous and Save on last tab when not editing; shows Update when editing', async () => {
    const user = userEvent.setup();
    const makeProps = createModalPropsFactory(baseProps);
    const { rerender } = render(<AddEditModal {...makeProps()} />);

    await assertControlledFinalTabActionFlow({
      user,
      rerender,
      renderModal: overrides => <AddEditModal {...makeProps(overrides)} />,
      lastTab: '2',
      saveLabel: 'Save',
      updateLabel: 'Update',
      saveSpy: baseProps.saveOrbitMonitoring,
      updateSpy: baseProps.saveOrbitMonitoring,
    });
  });
});
