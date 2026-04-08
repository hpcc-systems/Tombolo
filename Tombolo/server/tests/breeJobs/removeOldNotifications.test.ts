import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  cleanupSentNotifications,
  cleanupNotificationQueue,
  removeOldNotifications,
} from '../../jobs/notifications/removeOldNotifications.js';

import { mockedModels } from '../mockedModels.js';
const { SentNotification, NotificationQueue } = mockedModels;

import { parentPort } from 'worker_threads';

const workerParentPort = parentPort as NonNullable<typeof parentPort>;

describe('removeOldNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── cleanupSentNotifications ───────────────────────────────────────────────

  describe('cleanupSentNotifications', () => {
    it('should hard-delete sent notifications older than 90 days in batches until exhausted', async () => {
      // First batch returns full batch size → loop continues; second returns fewer → loop stops
      SentNotification.destroy
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(42);

      const result = await cleanupSentNotifications();

      expect(result).toBe(1042);
      expect(SentNotification.destroy).toHaveBeenCalledTimes(2);
      expect(SentNotification.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          force: true,
          limit: 1000,
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    it('should return 0 when there are no records to delete', async () => {
      SentNotification.destroy.mockResolvedValueOnce(0);

      const result = await cleanupSentNotifications();

      expect(result).toBe(0);
      expect(SentNotification.destroy).toHaveBeenCalledTimes(1);
    });

    it('should stop after a single batch when count is less than batch size', async () => {
      SentNotification.destroy.mockResolvedValueOnce(500);

      const result = await cleanupSentNotifications();

      expect(result).toBe(500);
      expect(SentNotification.destroy).toHaveBeenCalledTimes(1);
    });

    it('should propagate database errors', async () => {
      SentNotification.destroy.mockRejectedValueOnce(new Error('DB error'));

      await expect(cleanupSentNotifications()).rejects.toThrow('DB error');
    });
  });

  // ── cleanupNotificationQueue ───────────────────────────────────────────────

  describe('cleanupNotificationQueue', () => {
    it('should delete old queue entries with the safe predicate', async () => {
      NotificationQueue.destroy.mockResolvedValueOnce(25);

      const result = await cleanupNotificationQueue();

      expect(result).toBe(25);
      expect(NotificationQueue.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1000,
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    it('should run multiple batches when queue has many old records', async () => {
      NotificationQueue.destroy
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(300);

      const result = await cleanupNotificationQueue();

      expect(result).toBe(1300);
      expect(NotificationQueue.destroy).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when there is nothing to delete', async () => {
      NotificationQueue.destroy.mockResolvedValueOnce(0);

      const result = await cleanupNotificationQueue();

      expect(result).toBe(0);
    });

    it('should propagate database errors', async () => {
      NotificationQueue.destroy.mockRejectedValueOnce(new Error('Timeout'));

      await expect(cleanupNotificationQueue()).rejects.toThrow('Timeout');
    });
  });

  // ── removeOldNotifications ─────────────────────────────────────────────────

  describe('removeOldNotifications', () => {
    it('should log start, per-table counts, and completion with totals', async () => {
      SentNotification.destroy.mockResolvedValueOnce(5);
      NotificationQueue.destroy.mockResolvedValueOnce(3);

      await removeOldNotifications();

      expect(workerParentPort.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          text: expect.stringContaining('started'),
        })
      );
      expect(workerParentPort.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          text: expect.stringContaining('5'),
        })
      );
      expect(workerParentPort.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          text: expect.stringContaining('3'),
        })
      );
      // Total = 8 should appear in the completion message
      expect(workerParentPort.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          text: expect.stringContaining('8'),
        })
      );
    });

    it('should log a completion message even when nothing is deleted', async () => {
      SentNotification.destroy.mockResolvedValueOnce(0);
      NotificationQueue.destroy.mockResolvedValueOnce(0);

      await removeOldNotifications();

      expect(workerParentPort.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          text: expect.stringContaining('completed'),
        })
      );
    });

    it('should propagate errors thrown by cleanupSentNotifications', async () => {
      SentNotification.destroy.mockRejectedValueOnce(new Error('Disk full'));

      await expect(removeOldNotifications()).rejects.toThrow('Disk full');
    });
  });
});
