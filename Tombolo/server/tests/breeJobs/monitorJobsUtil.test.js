const util = require('../../jobs/jobMonitoring/monitorJobsUtil');
const moment = require('moment');

describe('monitorJobsUtil', () => {
  describe('matchJobName', () => {
    it('matches job name with wildcards and date', () => {
      const jobNameFormat = 'Job*<DATE>'; // Should match Job20250825
      const jobName = `Job${moment().format('YYYYMMDD')}`;
      expect(
        util.matchJobName({ jobNameFormat, jobName, timezone_offset: 0 })
      ).toBe(true);
    });
    it('does not match incorrect job name', () => {
      const jobNameFormat = 'Job*<DATE>';
      const jobName = 'OtherJob20250825';
      expect(
        util.matchJobName({ jobNameFormat, jobName, timezone_offset: 0 })
      ).toBe(false);
    });
  });

  describe('findStartAndEndTimes', () => {
    it('finds min and max dates', () => {
      const data = [
        { When: '2025-08-25T10:00:00Z' },
        { When: '2025-08-25T12:00:00Z' },
      ];
      const result = util.findStartAndEndTimes(data);
      expect(result.startTime).toBe('2025-08-25T10:00:00.000Z');
      expect(result.endTime).toBe('2025-08-25T12:00:00.000Z');
      expect(result.timeTaken).toBe(7200000);
    });
  });

  describe('wuStartTimeWhenLastScanAvailable', () => {
    it('adjusts scan time by offset', () => {
      const scanTime = '2025-08-25T10:00:00Z';
      const offset = 60; // 1 hour
      const result = util.wuStartTimeWhenLastScanAvailable(scanTime, offset);
      expect(result.getUTCHours()).toBe(11);
    });
  });

  describe('wuStartTimeWhenLastScanUnavailable', () => {
    it('adjusts current time by offset and backdate', () => {
      const currentTime = '2025-08-25T10:00:00Z';
      const offset = 60;
      const backDateMinutes = 30;
      const result = util.wuStartTimeWhenLastScanUnavailable(
        currentTime,
        offset,
        backDateMinutes
      );
      expect(result.getUTCHours()).toBe(10);
      expect(result.getUTCMinutes()).toBe(30);
    });
  });

  describe('findLocalDateTimeAtCluster', () => {
    it('returns local time with offset', () => {
      const offset = 120; // 2 hours
      const now = new Date();
      const local = util.findLocalDateTimeAtCluster(offset);
      expect(local.getTime()).toBeCloseTo(now.getTime() + 120 * 60 * 1000, -2);
    });
  });

  describe('generateNotificationId', () => {
    it('generates notification id', () => {
      const nowDate = new Date();

      const id = util.generateNotificationId({
        notificationPrefix: 'TEST',
        timezoneOffset: 0,
      });
      expect(id.startsWith(`TEST_${nowDate.getFullYear()}`)).toBe(true);
    });
  });

  describe('createNotificationPayload', () => {
    it('creates notification payload', () => {
      const payload = util.createNotificationPayload({
        type: 'email',
        templateName: 'template',
        originationId: 'orig',
        applicationId: 'app',
        subject: 'subject',
        recipients: {
          primaryContacts: ['a'],
          secondaryContacts: ['b'],
          notifyContacts: ['c'],
        },
        notificationId: 'id',
        issue: 'issue',
        firstLogged: 'first',
        lastLogged: 'last',
      });
      expect(payload.type).toBe('email');
      expect(payload.metaData.subject).toBe('subject');
      expect(payload.metaData.mainRecipients).toContain('a');
    });
  });

  describe('convertTotalClusterTimeToSeconds', () => {
    it('converts time string to seconds', () => {
      expect(util.convertTotalClusterTimeToSeconds('1:02:03')).toBe(3723);
      expect(util.convertTotalClusterTimeToSeconds('')).toBe(0);
    });
  });

  describe('convertSecondsToHumanReadableTime', () => {
    it('converts seconds to human readable', () => {
      expect(util.convertSecondsToHumanReadableTime(90061)).toBe('1d 1h 1m 1s');
    });
  });

  describe('inferWuStartTime', () => {
    it('infers start time from WUID', () => {
      const date = util.inferWuStartTime('W20250825-123456');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(7); // August is 7 (0-based)
      expect(date.getDate()).toBe(25);
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(34);
      expect(date.getSeconds()).toBe(56);
    });
    it('throws error for invalid WUID', () => {
      expect(() => util.inferWuStartTime('INVALID')).toThrow();
    });
  });

  describe('differenceInMs', () => {
    it('calculates difference in ms', () => {
      expect(
        util.differenceInMs({
          startTime: '10:00',
          endTime: '12:00',
          daysDifference: 0,
        })
      ).toBe(7200000);
    });
  });

  describe('generateJobName', () => {
    it('returns pattern if no <DATE>', () => {
      expect(util.generateJobName({ pattern: 'JobName' })).toBe('JobName');
    });
  });

  describe('checkIfCurrentTimeIsWithinRunWindow', () => {
    it('returns within, before, after', () => {
      const now = new Date('2025-08-25T10:00:00Z');
      expect(
        util.checkIfCurrentTimeIsWithinRunWindow({
          start: '09:00',
          end: '11:00',
          currentTime: now,
        })
      ).toBe('within');
      expect(
        util.checkIfCurrentTimeIsWithinRunWindow({
          start: '11:00',
          end: '12:00',
          currentTime: now,
        })
      ).toBe('before');
      expect(
        util.checkIfCurrentTimeIsWithinRunWindow({
          start: '08:00',
          end: '09:00',
          currentTime: now,
        })
      ).toBe('after');
    });
    it('returns null if start or end is null', () => {
      expect(
        util.checkIfCurrentTimeIsWithinRunWindow({
          start: null,
          end: null,
          currentTime: new Date(),
        })
      ).toBeNull();
    });
    it('throws error if currentTime is not a Date', () => {
      expect(() =>
        util.checkIfCurrentTimeIsWithinRunWindow({
          start: '09:00',
          end: '10:00',
          currentTime: 'not a date',
        })
      ).toThrow();
    });
  });
});
