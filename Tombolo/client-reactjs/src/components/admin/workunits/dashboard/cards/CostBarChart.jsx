import { Card, Tooltip } from 'antd';

// interface CostBarChartProps {
//   data: { date: string; cost: number }[];
// }

export default function CostBarChart({ data }) {
  const maxCost = Math.max(...data.map(d => d.cost), 1);

  return (
    <Card
      title={<span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Daily Cost Trend</span>}
      style={{
        background: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
      }}
      styles={{ body: { padding: '16px 20px' } }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 180,
          paddingTop: 8,
        }}>
        {data.map(item => {
          const heightPct = (item.cost / maxCost) * 100;
          return (
            <Tooltip
              key={item.date}
              title={
                <span>
                  {item.date}
                  <br />
                  <strong>${item.cost.toFixed(2)}</strong>
                </span>
              }>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    height: `${Math.max(heightPct, 2)}%`,
                    background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease, opacity 0.2s',
                    minHeight: 3,
                    opacity: 0.8,
                  }}
                  onMouseEnter={e => {
                    e.target /* as HTMLElement */.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    e.target /* as HTMLElement */.style.opacity = '0.8';
                  }}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginTop: 8,
          overflow: 'hidden',
        }}>
        {data.map((item, i) => (
          <div
            key={item.date}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10,
              color: '#9ca3af',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
            {i % Math.max(1, Math.floor(data.length / 8)) === 0 ? item.date : ''}
          </div>
        ))}
      </div>
    </Card>
  );
}
