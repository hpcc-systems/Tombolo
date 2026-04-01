import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Space, Spin, Tooltip, Typography } from 'antd';
import {
  AimOutlined,
  ColumnWidthOutlined,
  ExpandOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import workunitsService from '@/services/workunits.service';
import { AutosizeHpccJSComponent } from '@/components/common/HpccJSComponent';
import { MetricGraph, MetricGraphWidget } from '@/components/admin/workunits/history/details/panels/graph/metricGraph';
import { useMetricsGraphLayout } from '@/hooks/useMetricsGraphLayout';
import {
  defaultMetricsView,
  FetchStatus,
  isLayoutComplete,
  LayoutStatus,
} from '@/components/admin/workunits/history/details/panels/graph/metricsTypes';

const { Text } = Typography;

const TRANSITION_DURATION = 0;

interface GraphPanelProps {
  clusterId: string;
  wuid: string;
  selectedScopeId?: string | null;
  height?: string;
  /** When false (default) the graph will not fetch until this flips to true.
   *  Pass true once the containing tab is active. */
  active?: boolean;
}

const GraphPanel: React.FC<GraphPanelProps> = ({
  clusterId,
  wuid,
  selectedScopeId,
  height = '70vh',
  active = false,
}) => {
  // Stable instances — never re-created on re-render
  const metricGraphRef = useRef<MetricGraph | null>(null);
  const metricGraphWidgetRef = useRef<MetricGraphWidget | null>(null);
  if (!metricGraphRef.current) metricGraphRef.current = new MetricGraph();
  if (!metricGraphWidgetRef.current) metricGraphWidgetRef.current = new MetricGraphWidget().zoomToFitLimit(1);

  const metricGraph = metricGraphRef.current;
  const metricGraphWidget = metricGraphWidgetRef.current;

  // Data fetch state
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(FetchStatus.UNKNOWN);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dot, setDot] = useState<string>('');
  const [fallbackDot, setFallbackDot] = useState<string | null>(null);
  // Signals that metricGraph.load() has completed — triggers DOT (re)generation
  const [graphLoaded, setGraphLoaded] = useState(false);

  // ECLWatch pattern: widgetReady gates svg push; isRenderComplete gates spinner
  const [widgetReady, setWidgetReady] = useState(false);
  const [isRenderComplete, setIsRenderComplete] = useState(false);

  // Track the last DOT string we actually committed so we only reset
  // isRenderComplete when the graph itself is changing (not on leaf-node
  // clicks that keep the full-graph DOT unchanged).
  const dotRef = useRef<string>('');

  // Layout pipeline: DOT → SVG via Graphviz WASM
  const { svg, layoutStatus } = useMetricsGraphLayout(dot);

  // ── Fetch graph scopes from HPCC cluster ──────────────────────────────────
  const fetchGraph = useCallback(async () => {
    setFetchStatus(FetchStatus.STARTED);
    setFetchError(null);
    setDot('');
    dotRef.current = '';
    setIsRenderComplete(false);
    setGraphLoaded(false);
    try {
      const scopes = await workunitsService.getGraph(clusterId, wuid);
      metricGraph.load(scopes);
      setGraphLoaded(true); // triggers the DOT regen effect below
      setFetchStatus(FetchStatus.COMPLETE);
    } catch (err: any) {
      const msg = err?.messages?.[0] ?? err?.message ?? 'Failed to load graph — cluster may be unreachable.';
      setFetchError(msg);
      setFetchStatus(FetchStatus.COMPLETE);
    }
  }, [clusterId, metricGraph, wuid]);

  useEffect(() => {
    if (active) fetchGraph();
  }, [fetchGraph, active]);

  // ── Regenerate DOT whenever scope selection or loaded data changes ────────
  //
  // Two behaviours:
  //   Subgraph/graph selected  → graphTpl([name]) rebuilds DOT filtered to
  //                              just that scope and its descendants.
  //   Activity/vertex selected → keeps the full‑graph DOT unchanged; the
  //                              highlight effect zooms+highlights the node
  //                              inside the existing render without re‑layout.
  //   Nothing selected         → full‑graph DOT.
  //
  // We only reset isRenderComplete when the DOT string actually changes.
  // For leaf-node clicks the DOT stays the same, so we leave isRenderComplete
  // true so the highlight effect can fire immediately.
  //
  useEffect(() => {
    if (!graphLoaded) return;

    const fullDot = metricGraph.graphTpl([], defaultMetricsView);
    let newDot: string;

    if (selectedScopeId && metricGraph.subgraphExists(selectedScopeId)) {
      // Selected scope is a graph or subgraph — filter to it.
      newDot = metricGraph.graphTpl([selectedScopeId], defaultMetricsView);
      setFallbackDot(fullDot);
    } else {
      // No selection or a leaf vertex — show the full graph.
      newDot = fullDot;
      setFallbackDot(null);
    }

    if (newDot !== dotRef.current) {
      // DOT is genuinely changing — a new render cycle is needed.
      dotRef.current = newDot;
      setIsRenderComplete(false);
      setDot(newDot);
    }
    // If newDot === dotRef.current the DOT is unchanged (leaf node click).
    // isRenderComplete stays true, so the highlight effect fires directly.
  }, [graphLoaded, metricGraph, selectedScopeId]);

  // ── Wire up widget selection event once ───────────────────────────────────
  useEffect(() => {
    metricGraphWidget.on(
      'selectionChanged',
      () => {
        // Selection model is internal to the widget; no external state needed for v1
      },
      true
    );
  }, [metricGraphWidget]);

  // ── Push SVG into widget — ECLWatch pattern exactly ────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (widgetReady && isLayoutComplete(layoutStatus)) {
      // If filtered layout failed, silently fall back to the full-graph DOT
      if (layoutStatus === LayoutStatus.FAILED && fallbackDot) {
        dotRef.current = fallbackDot; // keep ref in sync with committed DOT
        setDot(fallbackDot);
        setFallbackDot(null);
        return;
      }
      const currentSVG = metricGraphWidget.svg();
      const sameSVG = currentSVG === svg;
      if (sameSVG) {
        setIsRenderComplete(true);
        return;
      }
      metricGraphWidget.svg(svg);
      metricGraphWidget
        .renderPromise()
        .then(() => {
          if (!cancelled) {
            metricGraphWidget.zoomToFit(TRANSITION_DURATION);
          }
        })
        .finally(() => {
          // isRenderComplete flipping to true triggers the highlight effect,
          // which applies the selection + zoomToSelection.
          if (!cancelled) setIsRenderComplete(true);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [fallbackDot, layoutStatus, metricGraphWidget, svg, widgetReady]);

  // ECLWatch: onReady only sets the ready flag — zoomToFit happens after renderPromise
  const onReady = useCallback(() => {
    setWidgetReady(true);
  }, []);

  // ── Update highlight/zoom when the same SVG is already rendered ──────────
  // Fires for: (a) leaf vertex clicks (DOT unchanged, isRenderComplete stays
  // true), and (b) when isRenderComplete flips back to true after a re‑render.
  useEffect(() => {
    if (!isRenderComplete) return;
    if (selectedScopeId) {
      metricGraphWidget.selection([selectedScopeId]);
      metricGraphWidget.zoomToSelection(300);
    } else {
      metricGraphWidget.clearSelection();
    }
  }, [isRenderComplete, metricGraphWidget, selectedScopeId]);

  // ── Spinner label — ECLWatch pattern exactly ─────────────────────────────
  const spinnerLabel: string = React.useMemo((): string => {
    if (fetchStatus === FetchStatus.STARTED) {
      return 'Fetching graph data…';
    } else if (fetchStatus === FetchStatus.COMPLETE && fetchError) {
      return '';
    } else if (!isLayoutComplete(layoutStatus)) {
      switch (layoutStatus) {
        case LayoutStatus.LONG_RUNNING:
          return 'Performing layout (large graph)…';
        case LayoutStatus.STARTED:
        default:
          return 'Performing layout…';
      }
    } else if (layoutStatus === LayoutStatus.FAILED) {
      return 'Graph layout failed';
    } else if (!isRenderComplete) {
      return 'Rendering…';
    }
    return '';
  }, [fetchStatus, fetchError, layoutStatus, isRenderComplete]);

  // ── Toolbar buttons ───────────────────────────────────────────────────────
  const toolbar = (
    <Space size="small">
      <Tooltip title="Zoom to fit">
        <Button icon={<ExpandOutlined />} size="small" onClick={() => metricGraphWidget.zoomToFit()} />
      </Tooltip>
      <Tooltip title="Fit width">
        <Button icon={<ColumnWidthOutlined />} size="small" onClick={() => metricGraphWidget.zoomToWidth()} />
      </Tooltip>
      <Tooltip title="100%">
        <Button size="small" onClick={() => metricGraphWidget.zoomToScale(1)}>
          1:1
        </Button>
      </Tooltip>
      <Tooltip title="Zoom in">
        <Button icon={<PlusOutlined />} size="small" onClick={() => metricGraphWidget.zoomPlus()} />
      </Tooltip>
      <Tooltip title="Zoom out">
        <Button icon={<MinusOutlined />} size="small" onClick={() => metricGraphWidget.zoomMinus()} />
      </Tooltip>
      <Tooltip title="Zoom to selection">
        <Button
          icon={<AimOutlined />}
          size="small"
          onClick={() => metricGraphWidget.zoomToSelection(TRANSITION_DURATION)}
        />
      </Tooltip>
      <Tooltip title="Reload graph">
        <Button
          icon={<ReloadOutlined />}
          size="small"
          loading={fetchStatus === FetchStatus.STARTED}
          onClick={fetchGraph}
        />
      </Tooltip>
    </Space>
  );

  // ── Error state ───────────────────────────────────────────────────────────
  if (fetchError) {
    const isDeleted = fetchError.toLowerCase().includes('cannot open workunit');
    return (
      <Card>
        <Alert
          type={isDeleted ? 'info' : 'warning'}
          showIcon
          message={isDeleted ? 'Workunit Deleted' : 'Graph Unavailable'}
          description={
            isDeleted ? 'The workunit has been deleted on the cluster and we are unable to build a graph.' : fetchError
          }
          action={
            !isDeleted && (
              <Button size="small" icon={<ReloadOutlined />} onClick={fetchGraph}>
                Retry
              </Button>
            )
          }
        />
      </Card>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Card
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      style={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--ant-color-border, #f0f0f0)',
          flexShrink: 0,
        }}>
        {toolbar}
      </div>

      {/* Graph canvas — widget ALWAYS rendered so ResizeObserver gives real dimensions */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Spinner overlay — absolute on top, never affects widget dimensions */}
        {spinnerLabel && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.85)',
              flexDirection: 'column',
              gap: 8,
            }}>
            {layoutStatus === LayoutStatus.FAILED ? (
              <Text type="danger">{spinnerLabel}</Text>
            ) : (
              <Spin size="large" tip={spinnerLabel} />
            )}
          </div>
        )}

        {/* Widget — no hidden prop, always has real container dimensions */}
        <AutosizeHpccJSComponent widget={metricGraphWidget} onReady={onReady} />
      </div>
    </Card>
  );
};

export default GraphPanel;
