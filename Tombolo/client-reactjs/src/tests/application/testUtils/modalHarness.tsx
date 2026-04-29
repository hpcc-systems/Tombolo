import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { Mock } from 'vitest';
import { expect } from 'vitest';

type ModalPropsFactory<T extends object> = (overrides?: Partial<T>) => T;

export const createModalPropsFactory = <T extends object>(baseProps: T): ModalPropsFactory<T> => {
  return (overrides: Partial<T> = {}) => ({ ...baseProps, ...overrides });
};

type FirstTabNavigationOptions = {
  assertCancelResetsToFirstTab?: boolean;
  cancelAction: () => Promise<void>;
  nextTab: string;
  setActiveTabSpy: Mock;
  user: { click: (element: Element) => Promise<void> };
};

export const assertFirstTabNavigationFlow = async ({
  assertCancelResetsToFirstTab = true,
  cancelAction,
  nextTab,
  setActiveTabSpy,
  user,
}: FirstTabNavigationOptions) => {
  await user.click(screen.getByText('Next'));
  expect(setActiveTabSpy).toHaveBeenCalledWith(nextTab);

  await cancelAction();
  if (assertCancelResetsToFirstTab) {
    expect(setActiveTabSpy).toHaveBeenCalledWith('0');
  }
};

type ControlledFinalTabFlowOptions = {
  editingProp?: string;
  lastTab: string;
  renderModal: (overrides?: Record<string, unknown>) => ReactElement;
  rerender: (ui: ReactElement) => void;
  saveLabel: string;
  saveSpy: Mock;
  updateLabel: string;
  updateSpy: Mock;
  user: { click: (element: Element) => Promise<void> };
};

export const assertControlledFinalTabActionFlow = async ({
  editingProp = 'isEditing',
  lastTab,
  renderModal,
  rerender,
  saveLabel,
  saveSpy,
  updateLabel,
  updateSpy,
  user,
}: ControlledFinalTabFlowOptions) => {
  rerender(renderModal({ activeTab: lastTab }));

  expect(screen.getByText('Previous')).toBeInTheDocument();
  await user.click(screen.getByText(saveLabel));
  expect(saveSpy).toHaveBeenCalled();

  rerender(
    renderModal({
      activeTab: lastTab,
      [editingProp]: true,
    })
  );

  await user.click(screen.getByText(updateLabel));
  expect(updateSpy).toHaveBeenCalled();
};

export const rerenderAcrossTabs = (
  rerender: (ui: ReactElement) => void,
  renderModal: (overrides?: Record<string, unknown>) => ReactElement,
  tabs: string[]
) => {
  tabs.forEach(tab => rerender(renderModal({ activeTab: tab })));
};

export const clickNextIfPresent = async (user: { click: (element: Element) => Promise<void> }) => {
  const nextButton = screen.queryByText('Next');
  if (nextButton) {
    await user.click(nextButton);
  }
};

type UncontrolledFinalTabActionOptions = {
  actionMatcher: RegExp | string;
  actionSpy: Mock;
  user: { click: (element: Element) => Promise<void> };
};

export const assertUncontrolledFinalTabAction = async ({
  actionMatcher,
  actionSpy,
  user,
}: UncontrolledFinalTabActionOptions) => {
  await clickNextIfPresent(user);
  await user.click(screen.getByText(actionMatcher));
  expect(actionSpy).toHaveBeenCalled();
};
