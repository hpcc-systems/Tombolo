import { Card, Statistic, Row, Col } from 'antd';
import { DollarOutlined, ClusterOutlined, ThunderboltOutlined, FieldTimeOutlined } from '@ant-design/icons';

// interface CostSummaryProps {
//   summary: Object;
// }

export default function CostSummary({ summary }) {
  const totalCost = summary.totalCost || 0;
  const totalJobs = summary.totalJobs || 0;
  const totalRuntimeHours = summary.totalRuntimeHours || 0;
  const avgCostPerJob = summary.avgCostPerJob || 0;
  const failedJobs = summary.failedCount || 0;
  const failedCost = summary.failedCost || 0;

  const stats = [
    {
      title: 'Total Cost',
      value: totalCost,
      prefix: '$',
      precision: 2,
      icon: <DollarOutlined />,
      color: '#3dd68c',
    },
    {
      title: 'Total Workunits',
      value: totalJobs,
      precision: 0,
      icon: <ClusterOutlined />,
      color: '#5b8def',
    },
    {
      title: 'Total Runtime Hours',
      value: totalRuntimeHours,
      precision: 1,
      icon: <ThunderboltOutlined />,
      color: '#e8b84b',
    },
    {
      title: 'Avg Cost / Workunit',
      value: avgCostPerJob,
      prefix: '$',
      precision: 2,
      icon: <FieldTimeOutlined />,
      color: '#b68ade',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map(stat => (
        <Col xs={24} sm={12} lg={6} key={stat.title}>
          <Card
            style={{
              background: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 8,
            }}
            styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  background: `${stat.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: stat.color,
                  flexShrink: 0,
                }}>
                {stat.icon}
              </div>
              <Statistic
                title={<span style={{ color: '#6b7280', fontSize: 13 }}>{stat.title}</span>}
                value={stat.value}
                prefix={stat.prefix}
                precision={stat.precision}
                valueStyle={{
                  color: '#111827',
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono), monospace',
                }}
              />
            </div>
          </Card>
        </Col>
      ))}
      {failedJobs > 0 && (
        <Col span={24}>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#dc2626',
            }}>
            <span style={{ fontWeight: 600 }}>
              {failedJobs} failed job{failedJobs > 1 ? 's' : ''}
            </span>
            <span style={{ color: '#b91c1c' }}>{'  |  '}</span>
            <span>
              Cost:{' '}
              <span style={{ fontFamily: 'var(--font-mono), monospace', color: '#111827' }}>
                ${failedCost.toFixed(2)}
              </span>
            </span>
          </div>
        </Col>
      )}
    </Row>
  );
}
