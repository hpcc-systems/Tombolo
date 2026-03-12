import React, { useEffect, useMemo, useState } from 'react';
import { Card, Checkbox, Empty, Input, InputNumber, Space, Tag, Tooltip, Tree } from 'antd';
import { SearchOutlined, ClusterOutlined } from '@ant-design/icons';
import { formatBytes, formatNumber, formatSeconds, normalizeLabel, SCOPE_TYPES } from '@tombolo/shared';
import { loadLocalStorage, saveLocalStorage } from '@tombolo/shared/browser';
import styles from '../../workunitHistory.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

export function buildScopeTree(details: any[]) {
  const map = new Map();
  const roots: any[] = [];
  details.forEach(d => {
    const key = d.scopeId || d.scopeName;
    map.set(key, { ...d, key, children: [] });
  });
  details.forEach(d => {
    const key = d.scopeId || d.scopeName;
    const node = map.get(key);
    const sid = d.scopeId;
    if (d.scopeType === 'graph' || !sid || !sid.includes(':')) {
      roots.push(node);
    } else {
      const parentKey = sid.split(':').slice(0, -1).join(':');
      const parent = map.get(parentKey);
      (parent ? parent.children : roots).push(node);
    }
  });
  return roots;
}

export function findPathByKey(nodes: any[], key: any): { title: string; key: any }[] {
  const stack: any[] = [];
  const dfs = (list: any[]): boolean => {
    for (const n of list) {
      stack.push(n);
      if (n.key === key) return true;
      if (n.children && dfs(n.children)) return true;
      stack.pop();
    }
    return false;
  };
  dfs(nodes);
  return stack.map(n => ({ title: n.scopeName, key: n.key }));
}

export function flattenTree(nodes: any[]): any[] {
  const result: any[] = [];
  const dfs = (list: any[]) => {
    for (const n of list) {
      result.push(n);
      if (n.children) dfs(n.children);
    }
  };
  dfs(nodes);
  return result;
}

// ── Component ────────────────────────────────────────────────────────────────

export interface HierarchyExplorerSelectPayload {
  node: any | null;
  breadcrumb: { title: string; key: any }[];
}

interface HierarchyExplorerProps {
  details: any[];
  /** Prefix for localStorage keys — use different prefixes per tab to preserve independent state */
  storageKeyPrefix?: string;
  onSelect?: (payload: HierarchyExplorerSelectPayload) => void;
}

const HierarchyExplorer: React.FC<HierarchyExplorerProps> = ({
  details,
  storageKeyPrefix = 'wuh.explorer',
  onSelect,
}) => {
  const sk = (key: string) => `${storageKeyPrefix}.${key}`;

  const [types, setTypes] = useState<any>(loadLocalStorage(sk('types'), SCOPE_TYPES));
  const [q, setQ] = useState<string>(loadLocalStorage(sk('q'), ''));
  const [minElapsed, setMinElapsed] = useState<number>(loadLocalStorage(sk('minElapsed'), 0));
  const [expandedKeys, setExpandedKeys] = useState<any[]>(loadLocalStorage(sk('expandedKeys'), []));
  const [selectedKey, setSelectedKey] = useState<any>(null);

  useEffect(() => saveLocalStorage(sk('types'), types), [types]);
  useEffect(() => saveLocalStorage(sk('q'), q), [q]);
  useEffect(() => saveLocalStorage(sk('minElapsed'), minElapsed), [minElapsed]);
  useEffect(() => saveLocalStorage(sk('expandedKeys'), expandedKeys), [expandedKeys]);

  const treeRaw = useMemo(() => buildScopeTree(details || []), [details]);

  const term = q.trim().toLowerCase();

  const nodeMatches = (n: any) => {
    if (!types.includes(n.scopeType)) return false;
    if (minElapsed && Number(n.TimeElapsed || 0) < Number(minElapsed)) return false;
    if (term) {
      const s = `${n.scopeName || ''} ${n.label || ''} ${n.fileName || ''}`.toLowerCase();
      if (!s.includes(term)) return false;
    }
    return true;
  };

  const treeFiltered = useMemo(() => {
    const clone = (node: any) => ({ ...node, children: node.children?.map(clone) || [] });
    const roots = treeRaw.map(clone);
    const prune = (node: any) => {
      const match = nodeMatches(node);
      node.children = node.children.map(prune).filter(Boolean);
      return match || node.children.length ? node : null;
    };
    return roots.map(prune).filter(Boolean);
  }, [treeRaw, types, term, minElapsed]);

  const flatList = useMemo(() => flattenTree(treeFiltered), [treeFiltered]);

  const selectedNode = useMemo(() => flatList.find((n: any) => n.key === selectedKey) || null, [flatList, selectedKey]);

  const breadcrumb = useMemo(
    () => (selectedKey ? findPathByKey(treeFiltered, selectedKey) : []),
    [treeFiltered, selectedKey]
  );

  // Notify parent whenever the resolved node or breadcrumb changes
  useEffect(() => {
    onSelect?.({ node: selectedNode, breadcrumb });
  }, [selectedNode, breadcrumb]);

  const renderTitle = (n: any) => (
    <Space size={8}>
      <Tag color="blue" className={styles.tagCapitalize}>
        {n.scopeType}
      </Tag>
      <span className={styles.ellipsis}>{n.scopeName}</span>
      {n.label && <span className={styles.mutedTextSmall}>({normalizeLabel(n.label)})</span>}
      <span className={`${styles.subtleText} ${styles.numericText}`}>
        <Tooltip title="Elapsed">⏱ {formatSeconds(n.TimeElapsed)}</Tooltip>
        {n.NumRowsProcessed != null && (
          <>
            {' '}
            • <Tooltip title="Rows">🔢 {formatNumber(n.NumRowsProcessed)}</Tooltip>
          </>
        )}
        {n.PeakMemoryUsage != null && (
          <>
            {' '}
            • <Tooltip title="Peak Memory">🧠 {formatBytes(n.PeakMemoryUsage)}</Tooltip>
          </>
        )}
      </span>
    </Space>
  );

  const toAntTreeNodes = (nodes: any[]): any[] =>
    nodes.map(n => ({
      key: n.key,
      title: renderTitle(n),
      children: n.children && n.children.length ? toAntTreeNodes(n.children) : undefined,
    }));

  const antTreeData = useMemo(() => toAntTreeNodes(treeFiltered), [treeFiltered]);

  return (
    <Card
      title={
        <Space>
          <ClusterOutlined /> Hierarchy Explorer
        </Space>
      }
      className={styles.cardNoBodyPadding}>
      <div className={styles.sectionHeader}>
        <Space wrap>
          <Input
            allowClear
            value={q}
            onChange={e => setQ(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Search scope, label, file"
            className={styles.w260}
          />
          <Checkbox.Group
            value={types}
            onChange={setTypes}
            options={[
              { label: 'Graph', value: 'graph' },
              { label: 'Subgraph', value: 'subgraph' },
              { label: 'Activity', value: 'activity' },
              { label: 'Operation', value: 'operation' },
            ]}
          />
          <Space size={8}>
            <span>Min Elapsed</span>
            <InputNumber
              min={0}
              value={minElapsed}
              onChange={(v: any) => setMinElapsed(Number(v || 0))}
              placeholder="s"
            />
          </Space>
        </Space>
      </div>
      <div className={styles.scrollAreaTall}>
        {antTreeData.length ? (
          <Tree
            blockNode
            showLine
            treeData={antTreeData}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            selectedKeys={selectedKey ? [selectedKey] : []}
            onSelect={keys => setSelectedKey(keys[0] ?? null)}
          />
        ) : (
          <Empty description="No scopes match filters" />
        )}
      </div>
    </Card>
  );
};

export default HierarchyExplorer;
