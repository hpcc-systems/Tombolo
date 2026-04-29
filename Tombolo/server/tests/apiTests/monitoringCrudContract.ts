import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Response } from 'supertest';
import { app } from '../test_server.js';
import { blacklistTokenIntervalId } from '../../utils/tokenBlackListing.js';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
type MutationMethod = Exclude<HttpMethod, 'get'>;

type RequestBodyBuilder<T> = (entity: T) => unknown;
type ArrangeFn<T> = (entity: T) => void | Promise<void>;
type AssertFn<T> = (res: Response, entity: T) => void | Promise<void>;

interface ApiCaseConfig<T> {
  title: string;
  method: HttpMethod;
  path: (entity: T) => string;
  buildEntity: () => T;
  expectedStatus: number | number[];
  arrange?: ArrangeFn<T>;
  requestBody?: RequestBodyBuilder<T>;
  assertSuccess?: boolean;
  assert?: AssertFn<T>;
}

interface MutationCaseConfig<T> {
  title: string;
  method: MutationMethod;
  path: string;
  buildBody: () => T;
  expectedStatus: number | number[];
  arrange?: ArrangeFn<T>;
  assertSuccess?: boolean;
  expectedMessage?: string;
  assert?: AssertFn<T>;
}

export function useMonitoringApiRouteLifecycle() {
  beforeEach(() => {
    vi.useFakeTimers();
    if (blacklistTokenIntervalId) {
      clearInterval(blacklistTokenIntervalId as NodeJS.Timeout);
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });
}

export function defineApiCase<T>(config: ApiCaseConfig<T>) {
  it(config.title, async () => {
    const entity = config.buildEntity();
    if (config.arrange) {
      await config.arrange(entity);
    }

    let req = request(app)[config.method](config.path(entity));

    if (config.method !== 'get') {
      req = config.requestBody
        ? req.send(config.requestBody(entity))
        : req.send(entity);
    }

    const res = await req;

    if (Array.isArray(config.expectedStatus)) {
      expect(config.expectedStatus).toContain(res.status);
    } else {
      expect(res.status).toBe(config.expectedStatus);
    }
    if (config.assertSuccess !== undefined) {
      expect(res.body.success).toBe(config.assertSuccess);
    }

    if (config.assert) {
      await config.assert(res, entity);
    }
  });
}

export function defineMutationCase<T>(config: MutationCaseConfig<T>) {
  it(config.title, async () => {
    const body = config.buildBody();
    if (config.arrange) {
      await config.arrange(body);
    }

    const res = await request(app)[config.method](config.path).send(body);

    if (Array.isArray(config.expectedStatus)) {
      expect(config.expectedStatus).toContain(res.status);
    } else {
      expect(res.status).toBe(config.expectedStatus);
    }
    if (config.assertSuccess !== undefined) {
      expect(res.body.success).toBe(config.assertSuccess);
    }
    if (config.expectedMessage !== undefined) {
      expect(res.body.message).toBe(config.expectedMessage);
    }

    if (config.assert) {
      await config.assert(res, body);
    }
  });
}
