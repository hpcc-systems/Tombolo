import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

type ActionCallbacks = {
  onView?: () => void;
  onEdit?: () => void;
  onApproveReject?: () => void;
  onDuplicate?: () => void;
};

export const runCommonTableActions = async (user: UserEvent, callbacks: ActionCallbacks) => {
  await user.click(screen.getByRole('button', { name: 'view' }));
  callbacks.onView?.();

  await user.click(screen.getByRole('button', { name: 'edit' }));
  callbacks.onEdit?.();

  await user.click(screen.getByText('Approve / Reject'));
  callbacks.onApproveReject?.();

  await user.click(screen.getByText('Duplicate'));
  callbacks.onDuplicate?.();
};

export const clickSelectFirstRow = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'select-first' }));
};

export const assertNonApprovedToggleError = async (
  user: UserEvent,
  actionLabel: 'Start' | 'Pause',
  notificationError: (...args: unknown[]) => unknown
) => {
  await user.click(screen.getByText(actionLabel));
  expect(notificationError).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Error occurred',
      description: expect.anything(),
    })
  );
};
