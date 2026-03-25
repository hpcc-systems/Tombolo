import type { IScope } from '@hpcc-js/comms';

export interface IScopeEx extends IScope {
  __exceptions?: Array<{ Severity: string; Message: string }>;
}

export interface MetricsView {
  ignoreGlobalStoreOutEdges: boolean;
  subgraphTpl: string;
  activityTpl: string;
  edgeTpl: string;
}

export const defaultMetricsView: MetricsView = {
  ignoreGlobalStoreOutEdges: true,
  subgraphTpl: '%id% - %TimeElapsed%',
  activityTpl: '%Label%',
  edgeTpl: '%Label%\n%NumRowsProcessed%',
};

export enum FetchStatus {
  UNKNOWN,
  STARTED,
  COMPLETE,
}

export enum LayoutStatus {
  UNKNOWN,
  STARTED,
  LONG_RUNNING,
  COMPLETED,
  FAILED,
}

export function isLayoutComplete(status: LayoutStatus): boolean {
  return status === LayoutStatus.COMPLETED || status === LayoutStatus.FAILED;
}
