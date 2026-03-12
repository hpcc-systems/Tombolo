// Adapted from HPCC-Systems/HPCC-Platform ECLWatch source.

import { d3Event, select as d3Select, SVGZoomWidget } from '@hpcc-js/common';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
import { Graph2, hashSum, scopedLogger } from '@hpcc-js/util';
import { LayoutStatus, isLayoutComplete } from './metricsTypes';
import type { IScopeEx, MetricsView } from './metricsTypes';

import './metricGraph.css';

const logger = scopedLogger('tombolo/util/metricGraph.ts');

// Simple %key% template formatter replacing ECLWatch's src/Utility format()
function format(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/%(\w+)%/g, (_, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

const TypeShape: Record<string, string> = {
  function: 'plain" fillcolor="" style="',
};

const KindShape: Record<number, string> = {
  2: 'cylinder',
  3: 'tripleoctagon',
  5: 'invtrapezium',
  6: 'diamond',
  7: 'trapezium',
  16: 'cylinder',
  17: 'invtrapezium',
  19: 'doubleoctagon',
  22: 'cylinder',
  28: 'diamond',
  71: 'cylinder',
  73: 'cylinder',
  74: 'cylinder',
  94: 'cylinder',
  125: 'circle',
  133: 'cylinder',
  146: 'doubleoctagon',
  148: 'cylinder',
  155: 'invhouse',
  161: 'invhouse',
  185: 'invhouse',
  195: 'cylinder',
  196: 'cylinder',
};

function shape(v: IScopeEx): string {
  return TypeShape[v.type] ?? KindShape[Number(v.Kind)] ?? 'rectangle';
}

const CHARS = new Set('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
function encodeID(id: string): string {
  let retVal = '';
  for (let i = 0; i < id.length; ++i) {
    if (CHARS.has(id.charAt(i))) {
      retVal += id.charAt(i);
    } else {
      retVal += `__${id.charCodeAt(i)}__`;
    }
  }
  return retVal;
}

function decodeID(id: string): string {
  return id.replace(/__(\d+)__/gm, (_match, p1) => String.fromCharCode(+p1));
}

function encodeLabel(label: string): string {
  // Escape backslashes FIRST, then double-quotes, then newlines.
  // Order matters: escaping " must be done after escaping \,
  // otherwise a label like `foo\` produces `foo\"` which breaks DOT.
  return label.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

interface IScopeEdge extends IScopeEx {
  IdSource: string;
  IdTarget: string;
}

type ScopeStatus = 'unknown' | 'started' | 'completed';
type ExceptionStatus = 'warning' | 'error';

export class MetricGraph extends Graph2<IScopeEx, IScopeEdge, IScopeEx> {
  protected _index: { [name: string]: IScopeEx } = {};
  protected _activityIndex: { [id: string]: string } = {};

  constructor() {
    super();
    this.idFunc(scope => scope.name);
    this.sourceFunc(scope => this._activityIndex[scope.IdSource]);
    this.targetFunc(scope => this._activityIndex[scope.IdTarget]);
    this.load([]);
  }

  clear(): this {
    super.clear();
    this._index = {};
    this._activityIndex = {};
    return this;
  }

  protected parentName(scopeName: string): string | undefined {
    const lastIdx = scopeName.lastIndexOf(':');
    if (lastIdx >= 0) {
      return scopeName.substring(0, lastIdx);
    }
    return !scopeName ? undefined : '';
  }

  protected scopeID(scopeName: string): string {
    const lastIdx = scopeName.lastIndexOf(':');
    if (lastIdx >= 0) {
      return scopeName.substring(lastIdx + 1);
    }
    return scopeName;
  }

  childCount(scopeName: string): number {
    return this.allVertices().filter(v => v.name.startsWith(scopeName)).length;
  }

  protected ensureLineage(_scope: IScopeEx): IScopeEx {
    let scope = this._index[_scope.name];
    if (!scope) {
      scope = _scope;
      scope.__children = scope.__children || [];
      scope.__parentName = scope.__parentName || this.parentName(scope.name);
      this._index[scope.name] = scope;
    }
    if (scope.__parentName !== undefined) {
      let parent = this._index[scope.__parentName];
      if (!parent) {
        parent = this.ensureLineage({
          __formattedProps: {},
          __groupedProps: {},
          __StdDevs: 0,
          __StdDevsSource: '',
          id: this.scopeID(scope.__parentName),
          name: scope.__parentName,
          type: 'unknown',
          Kind: '-1',
          Label: 'unknown',
        } as IScopeEx);
      }
      parent.__children.push(scope);
    }
    return scope;
  }

  protected ensureGraphLineage(scope: IScopeEx): void {
    let parent = this._index[scope.__parentName];
    if (parent === scope) {
      parent = undefined;
    }
    if (parent && !this.subgraphExists(parent.name)) {
      this.ensureGraphLineage(parent);
    }
    if (scope.__children?.length > 0 && !this.subgraphExists(scope.name)) {
      this.addSubgraph(scope, parent);
    }
  }

  lineage(scope: IScopeEx): IScopeEx[] {
    const retVal: IScopeEx[] = [];
    while (scope) {
      retVal.push(scope);
      scope = this._index[scope.__parentName];
    }
    return retVal.reverse();
  }

  load(data: IScopeEx[]): this {
    this.clear();

    data.forEach((scope: IScopeEx) => {
      this.ensureLineage(scope);
    });

    data.forEach((scope: IScopeEx) => {
      const parentScope = this._index[scope.__parentName];
      this.ensureGraphLineage(scope);
      switch (scope.type) {
        case 'activity':
          this._activityIndex[scope.id] = scope.name;
          this.addVertex(scope, parentScope);
          break;
        case 'edge':
          break;
        default:
          if (!scope.__children.length) {
            this._activityIndex[scope.id] = scope.name;
            this.addVertex(scope, parentScope);
          }
      }
    });

    data.forEach((scope: IScopeEx) => {
      if (scope.type === 'edge' && scope.IdSource !== undefined && scope.IdTarget !== undefined) {
        if (!this.vertexExists(this._activityIndex[(scope as IScopeEdge).IdSource]))
          logger.warning(`Missing vertex:  ${(scope as IScopeEdge).IdSource}`);
        else if (!this.vertexExists(this._activityIndex[(scope as IScopeEdge).IdTarget])) {
          logger.warning(`Missing vertex:  ${(scope as IScopeEdge).IdTarget}`);
        } else {
          if (scope.__parentName && !this.subgraphExists(scope.__parentName)) {
            logger.warning(`Edge missing subgraph:  ${scope.__parentName}`);
          }
          if (this.subgraphExists(scope.__parentName)) {
            this.addEdge(scope as IScopeEdge, this.subgraph(scope.__parentName));
          } else {
            this.addEdge(scope as IScopeEdge);
          }
        }
      }
    });

    return this;
  }

  safeID(id: string): string {
    return id.replace(/\s/, '_');
  }

  vertexLabel(v: IScopeEx, options: MetricsView): string {
    return v.type === 'activity'
      ? format(options.activityTpl, v as unknown as Record<string, unknown>)
      : v.type === 'function'
        ? v.id + '()'
        : v.type === 'operation' && v.id.charAt(0) === '>'
          ? v.id.substring(1)
          : (v.Label as string) || v.id;
  }

  vertexStatus(v: IScopeEx): ScopeStatus {
    const tally: { [id: string]: number } = { unknown: 0, started: 0, completed: 0 };
    let outEdges = this.vertexInternalOutEdges(v);
    if (outEdges.length === 0) {
      outEdges = this.inEdges(v.name);
    }
    outEdges.forEach(e => ++tally[this.edgeStatus(e)]);
    if (outEdges.length === tally['completed']) {
      return 'completed';
    } else if (tally['started'] || tally['completed']) {
      return 'started';
    }
    return 'unknown';
  }

  vertexClass(v: IScopeEx): string {
    const retVal: Array<ScopeStatus | ExceptionStatus> = [this.vertexStatus(v)];
    if (v.__exceptions) {
      const severity: { [id: string]: number } = {};
      v.__exceptions.forEach(ex => {
        if (!severity[ex.Severity]) {
          severity[ex.Severity] = 0;
        }
        severity[ex.Severity]++;
      });
      if (severity['Error']) {
        retVal.push('error');
      } else if (severity['Warning']) {
        retVal.push('warning');
      }
    }
    return retVal.join(' ');
  }

  vertexInternalOutEdges(v: IScopeEx): IScopeEdge[] {
    return this.outEdges(v.name).filter(e => e.__parentName === v.__parentName);
  }

  protected _dedupVertices: { [scopeName: string]: boolean } = {};

  private _buildVertexTemplate(v: IScopeEx, options: MetricsView, isHidden = false): string {
    if (this._dedupVertices[v.id] === true) return '';
    this._dedupVertices[v.id] = true;

    const encodedId = encodeID(v.name);
    const encodedLabel = encodeLabel(this.vertexLabel(v, options));
    const vertexShape = shape(v);
    const vertexClass = this.vertexClass(v);
    const rankAttr = isHidden ? ' rank="min"' : '';

    return `"${v.id}" [id="${encodedId}" label="${encodedLabel}" shape="${vertexShape}" class="${vertexClass}"${rankAttr}]`;
  }

  vertexTpl(v: IScopeEx, options: MetricsView): string {
    return this._buildVertexTemplate(v, options, false);
  }

  hiddenTpl(v: IScopeEx, options: MetricsView): string {
    return this._buildVertexTemplate(v, options, true);
  }

  findFirstVertex(scopeName: string): string | undefined {
    if (this.vertexExists(scopeName)) {
      return this.vertex(scopeName).id;
    }
    for (const child of this.item(scopeName).__children) {
      const childID = this.findFirstVertex(child.name);
      if (childID) {
        return childID;
      }
    }
  }

  edgeStatus(e: IScopeEdge): ScopeStatus {
    const starts = Number(e.NumStarts ?? 0);
    const stops = Number(e.NumStops ?? 0);
    if (!isNaN(starts) && !isNaN(stops)) {
      if (starts > 0) {
        if (starts === stops) {
          return 'completed';
        }
        return 'started';
      }
    }
    return 'unknown';
  }

  protected _dedupEdges: { [scopeName: string]: boolean } = {};
  edgeTpl(e: IScopeEdge, options: MetricsView): string {
    if (this._dedupEdges[e.id] === true) return '';
    this._dedupEdges[e.id] = true;

    const sourceVertexName = this._activityIndex[e.IdSource];
    const targetVertexName = this._activityIndex[e.IdTarget];

    if (options.ignoreGlobalStoreOutEdges && sourceVertexName) {
      const sourceVertex = this.vertex(sourceVertexName);
      if (sourceVertex.Kind === '22') {
        return '';
      }
    }

    const ltail = this.subgraphExists(this._sourceFunc(e)) ? `ltail=cluster_${e.IdSource}` : '';
    const lhead = this.subgraphExists(this._targetFunc(e)) ? `lhead=cluster_${e.IdTarget}` : '';

    let edgeStyle = 'solid';
    if (sourceVertexName && targetVertexName) {
      const sourceParent = this.vertexParent(sourceVertexName);
      const targetParent = this.vertexParent(targetVertexName);
      edgeStyle = sourceParent === targetParent ? 'solid' : 'dashed';
    }

    const formatData = e.__formattedProps ? Object.assign({}, e, e.__formattedProps) : e;

    const encodedName = encodeID(e.name);
    const encodedLabel = encodeLabel(format(options.edgeTpl, formatData as unknown as Record<string, unknown>));
    const edgeClass = this.edgeStatus(e);

    return `"${e.IdSource}" -> "${e.IdTarget}" [id="${encodedName}" label="${encodedLabel}" style="${edgeStyle}" class="${edgeClass}" ${ltail} ${lhead}]`;
  }

  subgraphStatus(sg: IScopeEx): ScopeStatus {
    const tally: { [id: string]: number } = { unknown: 0, started: 0, completed: 0 };
    const finalVertices = this.subgraphVertices(sg.name).filter(v => this.vertexInternalOutEdges(v).length === 0);
    finalVertices.forEach(v => ++tally[this.vertexStatus(v)]);
    if (finalVertices.length && finalVertices.length === tally['completed']) {
      return 'completed';
    } else if (tally['started'] || tally['completed']) {
      return 'started';
    }
    return 'unknown';
  }

  itemStatus(item: IScopeEx): ScopeStatus {
    if (this.isVertex(item)) {
      return this.vertexStatus(item);
    } else if (this.isEdge(item)) {
      return this.edgeStatus(item as IScopeEdge);
    } else if (this.isSubgraph(item)) {
      return this.subgraphStatus(item);
    }
    return 'unknown';
  }

  protected _dedupSubgraphs: { [scopeName: string]: boolean } = {};
  subgraphTpl(sg: IScopeEx, options: MetricsView): string {
    if (this._dedupSubgraphs[sg.id]) return '';
    this._dedupSubgraphs[sg.id] = true;

    const encodedId = encodeID(sg.id);
    const encodedName = encodeID(sg.name);
    const sgType = sg.type;
    const isChild = sgType === 'child';

    const childTpls: string[] = [];

    for (const child of this.subgraphSubgraphs(sg.name)) {
      const childTpl = this.subgraphTpl(child, options);
      if (childTpl) childTpls.push(childTpl);
    }

    const sgId = this.id(sg);
    if (this.vertexExists(sgId)) {
      childTpls.push(this.hiddenTpl(this.vertex(sgId), options));
    }

    for (const child of this.subgraphVertices(sg.name)) {
      childTpls.push(this.vertexTpl(child, options));
    }

    for (const child of this.subgraphEdges(sg.name)) {
      childTpls.push(this.edgeTpl(child, options));
    }

    const label = isChild
      ? ''
      : encodeLabel(
          format(
            sgType === 'activity' ? options.activityTpl : options.subgraphTpl,
            sg as unknown as Record<string, unknown>
          )
        );

    return `\
subgraph cluster_${encodedId} {
    color="black";
    fillcolor="white";
    style="${isChild ? 'dashed' : 'filled'}";
    id="${encodedName}";
    label="${label}";
    class="${this.subgraphStatus(sg)}";

    ${childTpls.join('\n')}

}`;
  }

  graphTpl(ids: string[] = [], options: MetricsView): string {
    this._dedupSubgraphs = {};
    this._dedupVertices = {};
    this._dedupEdges = {};
    const childTpls: string[] = [];

    if (ids?.length) {
      const idSet = new Set(ids);

      for (const id of ids) {
        let subgraph: IScopeEx | undefined;

        if (this.subgraphExists(id)) {
          subgraph = this.subgraph(id);
        } else {
          const item = this.item(id);
          if (item?.__parentName && this.subgraphExists(item.__parentName)) {
            subgraph = this.subgraph(item.__parentName);
          }
        }

        if (subgraph) {
          childTpls.push(this.subgraphTpl(subgraph, options));
        }
      }

      for (const edge of this.allEdges()) {
        const sourceVertexName = this._activityIndex[edge.IdSource];
        const targetVertexName = this._activityIndex[edge.IdTarget];

        if (sourceVertexName && targetVertexName) {
          const sourceVertex = this.vertex(sourceVertexName);
          const targetVertex = this.vertex(targetVertexName);
          const sourceParentId = sourceVertex.__parentID;
          const targetParentId = targetVertex.__parentID;

          if (sourceParentId !== targetParentId && idSet.has(sourceParentId) && idSet.has(targetParentId)) {
            childTpls.push(this.edgeTpl(edge, options));
          }
        }
      }
    } else {
      for (const child of this.subgraphs()) {
        childTpls.push(this.subgraphTpl(child, options));
      }
      for (const child of this.vertices()) {
        childTpls.push(this.vertexTpl(child, options));
      }
      for (const child of this.edges()) {
        childTpls.push(this.edgeTpl(child, options));
      }
    }

    return `\
digraph G {
    compound=true;
    ordering=in;
    graph [fontname="arial" fillcolor="white" style="filled"];
    node [fontname="arial" color="black" fillcolor="whitesmoke" style="filled" margin=0.2];
    edge [];

    ${childTpls.join('\n')}

}`;
  }
}

// ---------------------------------------------------------------------------
// Rect helper used for bbox calculations in MetricGraphWidget
// ---------------------------------------------------------------------------
export class Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;

  toStruct(): { x: number; y: number; width: number; height: number } {
    return { x: this.left, y: this.top, width: this.right - this.left, height: this.bottom - this.top };
  }

  extend(rect: SVGRect): void {
    if (this.left === undefined || this.left > rect.x) this.left = rect.x;
    if (this.top === undefined || this.top > rect.y + rect.height) this.top = rect.y + rect.height;
    if (this.right === undefined || this.right < rect.x + rect.width) this.right = rect.x + rect.width;
    if (this.bottom === undefined || this.bottom < rect.y) this.bottom = rect.y;
  }
}

// ---------------------------------------------------------------------------
// Graphviz WASM layout cache
// ---------------------------------------------------------------------------
interface GraphvizWorkerResponse {
  svg: string;
}
interface GraphvizWorkerError {
  error: string;
  errorDot: string;
}

export function isGraphvizWorkerResponse(r: GraphvizWorkerResponse | GraphvizWorkerError): r is GraphvizWorkerResponse {
  return (r as GraphvizWorkerResponse).svg !== undefined;
}

interface GraphvizWorker {
  terminate: () => void;
  response: Promise<GraphvizWorkerResponse | GraphvizWorkerError>;
  svg?: string;
  error?: string;
}

export { LayoutStatus, isLayoutComplete } from './metricsTypes';

class LayoutCache {
  protected _cache: { [key: string]: GraphvizWorker } = {};
  private _gv: Promise<Graphviz> | null = null;

  private getGraphviz(): Promise<Graphviz> {
    if (!this._gv) this._gv = Graphviz.load();
    return this._gv;
  }

  calcSVG(dot: string): Promise<GraphvizWorkerResponse | GraphvizWorkerError> {
    const hashDot = hashSum(dot);
    if (!(hashDot in this._cache)) {
      const responsePromise: Promise<GraphvizWorkerResponse | GraphvizWorkerError> = this.getGraphviz()
        .then(gv => {
          try {
            const svg = gv.layout(dot, 'svg', 'dot');
            this._cache[hashDot].svg = svg;
            return { svg } as GraphvizWorkerResponse;
          } catch (e: any) {
            const error = e?.message ?? String(e);
            logger.error(`Invalid DOT:  ${error}`);
            this._cache[hashDot].error = error;
            return { error, errorDot: dot } as GraphvizWorkerError;
          }
        })
        .catch(e => {
          const error = e?.message ?? String(e);
          logger.error(`Graphviz WASM load failed:  ${error}`);
          this._cache[hashDot].error = error;
          return { error, errorDot: dot } as GraphvizWorkerError;
        });
      this._cache[hashDot] = { terminate: () => {}, response: responsePromise };
    }
    return this._cache[hashDot].response;
  }

  svg(dot: string): string {
    const hashDot = hashSum(dot);
    if (hashDot in this._cache) {
      return this._cache[hashDot].svg ?? '';
    }
    return '';
  }

  status(dot: string): LayoutStatus {
    const hashDot = hashSum(dot);
    if (!(hashDot in this._cache)) return LayoutStatus.UNKNOWN;
    if (this._cache[hashDot].svg) return LayoutStatus.COMPLETED;
    if (this._cache[hashDot].error) return LayoutStatus.FAILED;
    return LayoutStatus.STARTED;
  }

  isComplete(dot: string): boolean {
    return isLayoutComplete(this.status(dot));
  }
}

export const layoutCache = new LayoutCache();

// ---------------------------------------------------------------------------
// MetricGraphWidget — SVG interaction layer
// ---------------------------------------------------------------------------
export class MetricGraphWidget extends SVGZoomWidget {
  protected _selection: { [id: string]: boolean } = {};

  constructor() {
    super();
    this._drawStartPos = 'origin';
    this.showToolbar(false);
    this._iconBar.buttons([]);
  }

  exists(id: string): boolean {
    return !!id && !this._renderElement.select(`#${encodeID(id)}`).empty();
  }

  clearSelection(broadcast = false): void {
    Object.keys(this._selection)
      .filter(name => !!name)
      .forEach(name => {
        d3Select(`#${encodeID(name)}`).classed('selected', false);
      });
    this._selection = {};
    this._selectionChanged(broadcast);
  }

  toggleSelection(id: string, broadcast = false): void {
    if (this._selection[id]) {
      delete this._selection[id];
    } else {
      this._selection[id] = true;
    }
    this._selectionChanged(broadcast);
  }

  selectionCompare(_: string[]): boolean {
    const currSelection = this.selection();
    return currSelection.length !== _.length || _.some(id => currSelection.indexOf(id) < 0);
  }

  selection(): string[];
  selection(_: string[]): this;
  selection(_: string[], broadcast: boolean): this;
  selection(_?: string[], broadcast = false): string[] | this {
    if (!arguments.length) return Object.keys(this._selection);
    if (this.selectionCompare(_)) {
      this.clearSelection();
      _.forEach(id => (this._selection[id] = true));
      this._selectionChanged(broadcast);
    }
    return this;
  }

  itemBBox(scopeID: string): { x: number; y: number; width: number; height: number } {
    const rect = new Rect();
    const elem = this._renderElement.select(`#${encodeID(scopeID)}`);
    const node = elem.node() as SVGGraphicsElement;
    if (node) rect.extend(node.getBBox());
    const bbox = rect.toStruct();
    const renderBBox = this._renderElement.node().getBBox();
    bbox.y += renderBBox.height;
    return bbox;
  }

  selectionBBox(): { x: number; y: number; width: number; height: number } {
    const rect = new Rect();
    this.selection()
      .filter(sel => !!sel)
      .forEach(sel => {
        const elem = this._renderElement.select(`#${encodeID(sel)}`);
        if (elem?.node()) {
          rect.extend((elem.node() as SVGGraphicsElement).getBBox());
        }
      });
    const bbox = rect.toStruct();
    const renderBBox = this._renderElement.node().getBBox();
    bbox.y += renderBBox.height;
    return bbox;
  }

  _selectionChanged(broadcast = false): void {
    const context = this;
    this._renderElement.selectAll('.node,.edge,.cluster').each(function (this: SVGGElement) {
      d3Select(this)
        .selectAll('path,polygon,ellipse')
        .style('stroke', () => {
          return context._selection[decodeID((this as SVGGElement).id)]
            ? 'var(--ant-color-primary, #1677ff)'
            : undefined;
        })
        .filter(function (this: SVGElement) {
          return this.tagName !== 'path';
        })
        .style('fill', () => {
          return context._selection[decodeID((this as SVGGElement).id)]
            ? 'var(--ant-color-primary-bg, #e6f4ff)'
            : undefined;
        });
    });
    if (broadcast) {
      this.selectionChanged();
    }
  }

  protected _prevSVG = '';
  protected _svg = '';

  reset(): this {
    this._prevSVG = '';
    return this;
  }

  svg(): string;
  svg(_: string): this;
  svg(_?: string): this | string {
    if (arguments.length === 0) return this._svg;
    this._svg = _;
    return this;
  }

  centerOnItem(scopeID: string): this {
    this.centerOnBBox(this.itemBBox(scopeID));
    return this;
  }

  centerOnSelection(transitionDuration?: number): this {
    this.centerOnBBox(this.selectionBBox(), transitionDuration);
    return this;
  }

  zoomToItem(scopeID: string): this {
    this.zoomToBBox(this.itemBBox(scopeID));
    return this;
  }

  zoomToSelection(transitionDuration?: number): this {
    this.zoomToBBox(this.selectionBBox(), transitionDuration);
    return this;
  }

  enter(domNode: HTMLElement, element: unknown): void {
    super.enter(domNode, element);
  }

  update(domNode: HTMLElement, element: unknown): void {
    super.update(domNode, element);
  }

  exit(domNode: HTMLElement, element: unknown): void {
    super.exit(domNode, element);
  }

  async renderSVG(svg: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._selection = {};
      const startPos = svg.indexOf('<g id=');
      const endPos = svg.indexOf('</svg>');
      if (startPos === -1 || endPos === -1) {
        logger.error(`renderSVG: unexpected SVG format — markers not found (startPos=${startPos}, endPos=${endPos})`);
        reject(new Error('SVG is not in the expected Graphviz format'));
        return;
      }
      this._renderElement.html(svg.substring(startPos, endPos));
      setTimeout(() => {
        this.zoomToFit(0);
        const context = this;
        this._renderElement.selectAll('.node,.edge,.cluster').on('click', function (this: SVGGElement) {
          const event = d3Event();
          if (!event.ctrlKey) {
            context.clearSelection();
          }
          context.toggleSelection(decodeID(this.id), true);
        });
        this._renderElement.selectAll('.node.warning,.node.error').each(function (this: SVGGElement) {
          const thisElement = d3Select(this);
          if (thisElement.select('text.warning').empty()) {
            const pos = this.getBBox();
            thisElement
              .append('text')
              .classed('warning', true)
              .attr('x', pos.x + pos.width - 12)
              .attr('y', pos.y + 12)
              .attr('font-size', '24px')
              .style('fill', 'var(--ant-color-warning, #faad14)')
              .style('stroke', 'none')
              .text('⚠');
          }
        });
        resolve();
      }, 0);
    });
  }

  render(callback?: (w: MetricGraphWidget) => void): this {
    return super.render(async (w: MetricGraphWidget) => {
      if (this._prevSVG !== this._svg) {
        this._prevSVG = this._svg;
        await this.renderSVG(this._svg);
      }
      if (callback) {
        callback(w);
      }
    });
  }

  // Events
  selectionChanged(): void {}
}

MetricGraphWidget.prototype._class += ' tombolo_MetricGraphWidget';
