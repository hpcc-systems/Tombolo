import { Card, Progress } from 'antd';

export interface ClusterCost {
  cluster: string;
  cost: number;
  count: number;
}

interface CostByEnvironmentProps {
  data: ClusterCost[];
}

const clusterColors: Record<string, string> = {
  thor: '#16a34a',
  roxie: '#2563eb',
  hthor: '#d97706',
  thor_400: '#7c3aed',
};

export default function CostByCluster({ data }: CostByEnvironmentProps) {
  const totalCost = data.reduce((s, d) => s + d.cost, 0);

  return (
    <Card
      title={<span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Cost by Environment</span>}
      style={{
        background: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
        height: '100%',
      }}
      styles={{ body: { padding: '16px 20px' } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(item => {
          const pct = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
          const color = clusterColors[item.cluster] || '#2563eb';
          return (
            <div key={item.cluster}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                <span
                  style={{
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                  {item.cluster}
                </span>
                <span
                  style={{
                    color: '#111827',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono), monospace',
                  }}>
                  ${item.cost.toFixed(2)}
                  <span
                    style={{
                      color: '#9ca3af',
                      marginLeft: 6,
                      fontSize: 11,
                    }}>
                    ({pct.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <Progress percent={pct} showInfo={false} strokeColor={color} trailColor="#f3f4f6" size="small" />
              <span style={{ color: '#9ca3af', fontSize: 11 }}>
                {item.count} workunit{item.count !== 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
