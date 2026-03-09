import { Card, Tooltip } from 'antd';

// interface CostBarChartProps {
//   data: { date: string; cost: number; failed: number; blocked: number; other: number }[];
// }

export default function CostBarChart({ data }) {
  const maxTotal = Math.max(...data.map(d => d.failed + d.blocked + d.other), 1);
  const maxCost = Math.max(...data.map(d => d.cost || 0), 1);

  // Format date to "Jan 19" format
  const formatDate = dateStr => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Generate nice y-axis labels
  const getYAxisSteps = max => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const normalized = max / magnitude;
    let step;
    if (normalized <= 1) step = 0.2 * magnitude;
    else if (normalized <= 2) step = 0.5 * magnitude;
    else if (normalized <= 5) step = 1 * magnitude;
    else step = 2 * magnitude;

    const steps = [];
    for (let i = 0; i <= max; i += step) {
      steps.push(i);
    }
    return steps;
  };

  const yAxisSteps = getYAxisSteps(maxCost);
  const yAxisMax = yAxisSteps[yAxisSteps.length - 1];

  return (
    <Card
      title={<span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Daily Cost & Status Trend</span>}
      style={{
        background: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
        height: '100%',
      }}
      styles={{ body: { padding: '16px 20px 16px 8px' } }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Y-axis */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 180,
            paddingTop: 8,
            minWidth: 38,
          }}>
          {yAxisSteps
            .slice()
            .reverse()
            .map((value, i) => (
              <div
                key={i}
                style={{
                  fontSize: 10,
                  color: '#9ca3af',
                  textAlign: 'right',
                  lineHeight: 1,
                }}>
                ${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
              </div>
            ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Grid lines */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 0,
              right: 0,
              height: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
            {yAxisSteps.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 1,
                  background: '#e5e7eb',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>

          {/* Bars */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              height: 180,
              paddingTop: 8,
            }}>
            {data.map(item => {
              const total = item.failed + item.blocked + item.other;
              const costPct = ((item.cost || 0) / yAxisMax) * 100;
              const failedPct = (item.failed / maxTotal) * 100;
              const blockedPct = (item.blocked / maxTotal) * 100;
              const otherPct = (item.other / maxTotal) * 100;

              return (
                <Tooltip
                  key={item.date}
                  title={
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{item.date}</div>
                      <div
                        style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        <div style={{ fontSize: 14, fontWeight: 'bold' }}>Cost: ${(item.cost || 0).toFixed(2)}</div>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <div style={{ color: '#22c55e' }}>✓ Good: {item.other}</div>
                        <div style={{ color: '#fbbf24' }}>⬤ Blocked: {item.blocked}</div>
                        <div style={{ color: '#ef4444' }}>✕ Failed: {item.failed}</div>
                      </div>
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        Total: {total} workunits
                      </div>
                    </div>
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
                        display: 'flex',
                        flexDirection: 'column',
                        height: `${Math.max(costPct, 2)}%`,
                        minHeight: 3,
                      }}>
                      {/* Failed - Red - Top */}
                      {item.failed > 0 && (
                        <div
                          style={{
                            width: '100%',
                            height: `${(failedPct / (otherPct + blockedPct + failedPct)) * 100}%`,
                            background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'opacity 0.2s',
                            opacity: 0.9,
                            minHeight: item.failed > 0 ? 2 : 0,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                        />
                      )}
                      {/* Blocked - Yellow - Middle */}
                      {item.blocked > 0 && (
                        <div
                          style={{
                            width: '100%',
                            height: `${(blockedPct / (otherPct + blockedPct + failedPct)) * 100}%`,
                            background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                            borderRadius: item.failed === 0 ? '4px 4px 0 0' : '0',
                            transition: 'opacity 0.2s',
                            opacity: 0.9,
                            minHeight: item.blocked > 0 ? 2 : 0,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                        />
                      )}
                      {/* Good - Green - Bottom */}
                      {item.other > 0 && (
                        <div
                          style={{
                            width: '100%',
                            height: `${(otherPct / (otherPct + blockedPct + failedPct)) * 100}%`,
                            background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: item.failed === 0 && item.blocked === 0 ? '4px 4px 0 0' : '0',
                            transition: 'opacity 0.2s',
                            opacity: 0.9,
                            minHeight: item.other > 0 ? 2 : 0,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date labels */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div style={{ minWidth: 38 }} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 4,
          }}>
          {data.map((item, i) => {
            const formattedDate = formatDate(item.date);
            const showLabel = i % Math.max(1, Math.floor(data.length / 8)) === 0;
            return (
              <div
                key={item.date}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 10,
                  color: '#9ca3af',
                }}>
                {showLabel ? formattedDate : ''}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
