import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { validationResult } from 'express-validator';
import {
  validateGetScopedSchema,
  validateScopedAnalyticsQuery,
} from '../../middlewares/workunitAnalyticsMiddleware.js';

async function runScopedValidation(body: Record<string, unknown>) {
  const req = {
    body,
  } as Request;

  for (const validator of validateScopedAnalyticsQuery) {
    await validator.run(req);
  }

  return {
    req,
    errors: validationResult(req).array(),
  };
}

async function runScopedSchemaValidation(query: Record<string, unknown>) {
  const req = {
    query,
  } as Request;

  for (const validator of validateGetScopedSchema) {
    await validator.run(req);
  }

  return {
    req,
    errors: validationResult(req).array(),
  };
}

describe('workunitAnalyticsScopedMiddleware query validation', () => {
  it('accepts scoped query with required scope fields', async () => {
    const { errors } = await runScopedValidation({
      sql: 'SELECT wuId, clusterId FROM work_unit_details LIMIT 10',
      options: {
        scopeToWuid: 'W20260101-123456',
        scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      },
    });

    expect(errors).toEqual([]);
  });

  it('rejects scoped query when scopeToWuid is missing', async () => {
    const { errors } = await runScopedValidation({
      sql: 'SELECT wuId FROM work_unit_details LIMIT 10',
      options: {
        scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      },
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0]?.msg)).toContain('scopeToWuid is required');
  });

  it('rejects clusters table in scoped query', async () => {
    const { errors } = await runScopedValidation({
      sql: 'SELECT id, name FROM clusters',
      options: {
        scopeToWuid: 'W20260101-123456',
        scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      },
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0]?.msg)).toContain(
      'Invalid table(s) for scoped query'
    );
  });

  it('rejects CTE queries on scoped endpoint', async () => {
    const { errors } = await runScopedValidation({
      sql: `
        WITH wu AS (
          SELECT wuId, clusterId FROM work_unit_details
        )
        SELECT wuId, clusterId FROM wu
      `,
      options: {
        scopeToWuid: 'W20260101-123456',
        scopeToClusterId: '58d5391a-ec05-4a64-97d3-e249bbba0bf0',
      },
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0]?.msg)).toContain('Invalid table(s):');
  });
});

describe('workunitAnalyticsScopedMiddleware schema validation', () => {
  it('accepts scoped schema table names', async () => {
    const { errors } = await runScopedSchemaValidation({
      tableName: 'work_unit_files',
    });

    expect(errors).toEqual([]);
  });

  it('rejects clusters table on scoped schema endpoint', async () => {
    const { errors } = await runScopedSchemaValidation({
      tableName: 'clusters',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0]?.msg)).toContain('scoped schema endpoint');
  });
});
