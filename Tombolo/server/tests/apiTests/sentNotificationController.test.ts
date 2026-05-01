import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import type { Request, Response } from 'express';

import { getNotificationHtml } from '../../controllers/sentNotificationController.js';
import { mockedModels } from '../mockedModels.js';
import { getSentNotification } from '../helpers.js';

const createMockResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json };
};

describe('sentNotificationController.getNotificationHtml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns rendered HTML when template exists', async () => {
    const notification = getSentNotification();
    const findByPk = vi.fn().mockResolvedValue(notification);
    (
      mockedModels.SentNotification as unknown as { findByPk: typeof findByPk }
    ).findByPk = findByPk;

    vi.spyOn(fs, 'existsSync').mockImplementation(pathValue =>
      String(pathValue).endsWith(
        '/jobs/notificationTemplates/email/verifyEmail.ejs'
      )
    );
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      '<div style="color:<%= theme.text %>">Template Rendered</div>'
    );

    const req = { body: { id: notification.id } } as Request;
    const res = createMockResponse() as unknown as Response;

    await getNotificationHtml(req, res);

    expect(findByPk).toHaveBeenCalledWith(notification.id, { raw: true });
    const responseBody = (res as unknown as { json: ReturnType<typeof vi.fn> })
      .json.mock.calls[0][0];
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toBe(
      'Notification HTML retrieved successfully'
    );
    expect(responseBody.data).toContain('Template Rendered');
  });

  it('returns null when template cannot be found', async () => {
    const notification = getSentNotification();
    const findByPk = vi.fn().mockResolvedValue(notification);
    (
      mockedModels.SentNotification as unknown as { findByPk: typeof findByPk }
    ).findByPk = findByPk;

    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const req = { body: { id: notification.id } } as Request;
    const res = createMockResponse() as unknown as Response;

    await getNotificationHtml(req, res);

    const responseBody = (res as unknown as { json: ReturnType<typeof vi.fn> })
      .json.mock.calls[0][0];
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toContain('Template verifyEmail not found');
    expect(responseBody.data).toBeNull();
  });
});
