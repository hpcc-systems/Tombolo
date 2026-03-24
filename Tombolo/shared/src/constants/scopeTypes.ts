export const SCOPE_TYPE_COLORS: Record<string, string> = {
  graph: '#1677ff',
  subgraph: '#52c41a',
  activity: '#faad14',
  operation: '#eb2f96',
};

export interface ScopeConfigEntry {
  color: string;
  label: string;
  icon: string;
}

export const SCOPE_CONFIG: Record<string, ScopeConfigEntry> = {
  graph: { color: '#1677ff', label: 'Graph', icon: '📊' },
  subgraph: { color: '#52c41a', label: 'Subgraph', icon: '📁' },
  activity: { color: '#faad14', label: 'Activity', icon: '⚙️' },
  operation: { color: '#eb2f96', label: 'Operation', icon: '🔧' },
};
