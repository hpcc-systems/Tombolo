import type { Mock } from 'vitest';
import * as models from '@tombolo/db';

type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer _A) => infer _R
    ? Mock
    : T[K] extends object
      ? DeepMocked<T[K]>
      : T[K];
};

export const mockedModels = models as unknown as DeepMocked<typeof models>;
