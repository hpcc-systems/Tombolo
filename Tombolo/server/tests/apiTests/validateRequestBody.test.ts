import express from 'express';
import request from 'supertest';
import { body } from 'express-validator';
import { describe, expect, it } from 'vitest';
import {
  validate,
  validateWithFirstErrorMessage,
} from '../../middlewares/validateRequestBody.js';

function buildApp(
  validatorBuilder: typeof validate | typeof validateWithFirstErrorMessage
) {
  const app = express();
  app.use(express.json());

  app.post(
    '/test',
    ...validatorBuilder(
      body('sql').custom(() => {
        throw new Error('Only SELECT statements are allowed');
      })
    ),
    (_req, res) => {
      res.status(200).json({ success: true });
    }
  );

  return app;
}

describe('validateRequestBody', () => {
  it('keeps generic validation message by default', async () => {
    const app = buildApp(validate);

    const res = await request(app)
      .post('/test')
      .send({ sql: 'UPDATE work_unit_details SET state = "x"' });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors[0]).toContain('Only SELECT statements are allowed');
  });

  it('uses first validation error as message when enabled', async () => {
    const app = buildApp(validateWithFirstErrorMessage);

    const res = await request(app)
      .post('/test')
      .send({ sql: 'UPDATE work_unit_details SET state = "x"' });

    expect(res.status).toBe(422);
    expect(res.body.message).toContain('Only SELECT statements are allowed');
    expect(res.body.errors[0]).toContain('Only SELECT statements are allowed');
  });
});
