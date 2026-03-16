import * as React from 'react';
import {
  isGraphvizWorkerResponse,
  layoutCache,
} from '../components/admin/workunitHistory/details/panels/graph/metricGraph';
import { LayoutStatus } from '../components/admin/workunitHistory/details/panels/graph/metricsTypes';

/**
 * Drives the Graphviz WASM layout pipeline for a DOT string.
 * Returns the rendered SVG and current layout status.
 *
 * Adapted from HPCC-Systems/HPCC-Platform ECLWatch hooks/metrics.ts
 * (stripped of FluentUI/ECLWatch-internal dependencies).
 */
export function useMetricsGraphLayout(dot: string): { svg: string; layoutStatus: LayoutStatus } {
  const [svg, setSvg] = React.useState<string>(layoutCache.svg(dot));
  const [layoutStatus, setLayoutStatus] = React.useState<LayoutStatus>(LayoutStatus.UNKNOWN);

  React.useEffect(() => {
    if (!dot) {
      setSvg('');
      setLayoutStatus(LayoutStatus.UNKNOWN);
      return;
    }

    let completedOrCancelled = false;

    // Immediately mark as in-progress so the spinner shows the right label
    setLayoutStatus(LayoutStatus.STARTED);

    // After 15 seconds still running, surface a "long running" status
    const longRunningTimer = setTimeout(() => {
      if (!completedOrCancelled) {
        setLayoutStatus(LayoutStatus.LONG_RUNNING);
      }
    }, 15_000);

    layoutCache
      .calcSVG(dot)
      .then(response => {
        if (isGraphvizWorkerResponse(response)) {
          if (!completedOrCancelled) {
            setSvg(response.svg);
          }
        } else {
          throw new Error(response.error);
        }
      })
      .catch(err => {
        console.error('[useMetricsGraphLayout]', err);
      })
      .finally(() => {
        clearTimeout(longRunningTimer);
        if (!completedOrCancelled) {
          setLayoutStatus(layoutCache.status(dot));
          completedOrCancelled = true;
        }
      });

    return () => {
      clearTimeout(longRunningTimer);
      completedOrCancelled = true;
    };
  }, [dot]);

  return { svg, layoutStatus };
}
