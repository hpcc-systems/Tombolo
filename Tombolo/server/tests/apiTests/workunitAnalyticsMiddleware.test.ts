import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { validationResult } from 'express-validator';
import { validateAnalyticsQuery } from '../../middlewares/workunitAnalyticsMiddleware.js';

async function runValidation(body: Record<string, unknown>) {
  const req = {
    body,
  } as Request;

  for (const validator of validateAnalyticsQuery) {
    await validator.run(req);
  }

  return {
    req,
    errors: validationResult(req).array(),
  };
}

describe('workunitAnalyticsMiddleware AST validation', () => {
  it('accepts read-only UNION select queries', async () => {
    const { req, errors } = await runValidation({
      sql: 'SELECT wuId FROM work_unit_details UNION SELECT wuId FROM work_units',
    });

    expect(errors).toEqual([]);
    expect(req.analyticsSqlContext).toBeDefined();
    expect(req.analyticsSqlContext?.ast.type).toBe('select');
    expect(req.analyticsSqlContext?.ast.set_op).toBe('union');
  });

  it('rejects non-select destructive statements', async () => {
    const { errors } = await runValidation({
      sql: 'DELETE FROM work_unit_details WHERE state = "completed"',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.msg).toContain('Only SELECT statements are allowed');
  });

  it('rejects multiple statements', async () => {
    const { errors } = await runValidation({
      sql: 'SELECT wuId FROM work_unit_details; SELECT wuId FROM work_units',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.msg).toContain('Multiple statements are not allowed');
  });

  it('rejects disallowed tables via AST references', async () => {
    const { errors } = await runValidation({
      sql: 'SELECT * FROM users',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0]?.msg)).toContain('Invalid table(s): users');
  });

  it('rejects sensitive clusters columns by AST selection', async () => {
    const { errors } = await runValidation({
      sql: 'SELECT c.username FROM clusters c',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(String(errors[0]?.msg)).toContain(
      "Column 'username' from clusters table is not allowed"
    );
  });

  it('attaches parsed AST context for controller reuse', async () => {
    const { req, errors } = await runValidation({
      sql: 'SELECT wuId, clusterId FROM work_unit_details;',
      options: {
        scopeToWuid: 'W20260101-123456',
      },
    });

    expect(errors).toEqual([]);
    expect(req.analyticsSqlContext).toBeDefined();
    expect(req.analyticsSqlContext?.hadTrailingSemicolon).toBe(true);
    expect(req.analyticsSqlContext?.normalizedSql).toBe(
      'SELECT wuId, clusterId FROM work_unit_details'
    );
  });
});
