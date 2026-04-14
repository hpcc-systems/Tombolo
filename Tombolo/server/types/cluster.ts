import { Cluster } from '@tombolo/db';
import type { InferAttributes } from 'sequelize';

export type ClusterWithPassword = InferAttributes<Cluster> & {
  password: string | null;
};
