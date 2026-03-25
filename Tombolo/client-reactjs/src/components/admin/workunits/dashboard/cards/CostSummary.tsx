import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
  DollarOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  FieldTimeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@tombolo/shared';

export interface DashboardSummary {
  totalCost?: number;
  totalJobs?: number;
  avgCostPerJob?: number;
  totalRuntimeHours?: number;
  failedCount?: number;
  failedCost?: number;
}

interface CostSummaryProps {
  summary: DashboardSummary;
}

interface StatItem {
  title: string;
  value: number;
  prefix?: string;
  precision: number;
  icon: React.ReactNode;
  color: string;
}

export default function CostSummary({ summary }: CostSummaryProps) {
  const totalCost = summary.totalCost || 0;
  const totalJobs = summary.totalJobs || 0;
  const totalRuntimeHours = summary.totalRuntimeHours || 0;
  const avgCostPerJob = summary.avgCostPerJob || 0;
  const failedJobs = summary.failedCount || 0;
  const failedCost = summary.failedCost || 0;

  const stats: StatItem[] = [
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
      precision: 2,
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

  const failedPercentage = totalCost > 0 ? ((failedCost / totalCost) * 100).toFixed(1) : '0.0';

  return (
    <Row gutter={[16, 16]} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {stats.map(stat => (
        <Col xs={24} sm={12} lg={6} style={{ flex: '1 1 0', minWidth: 200 }} key={stat.title}>
          <Card
            style={{
              background: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 8,
              height: '100%',
            }}
            styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: `${stat.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: stat.color,
                  flexShrink: 0,
                }}>
                {stat.icon}
              </div>
              <Statistic
                title={<span style={{ color: '#6b7280', fontSize: 12 }}>{stat.title}</span>}
                value={stat.value}
                prefix={stat.prefix}
                precision={stat.precision}
                valueStyle={{
                  color: '#111827',
                  fontSize: 22,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono), monospace',
                }}
              />
            </div>
          </Card>
        </Col>
      ))}

      {/* Failed Jobs Card - Only show if there are failed jobs */}
      {failedJobs > 0 && (
        <Col xs={24} sm={12} lg={6} style={{ flex: '1 1 0', minWidth: 200 }}>
          <Card
            style={{
              background: '#ffffff',
              borderColor: '#fecaca',
              borderRadius: 8,
              borderWidth: 1,
              height: '100%',
            }}
            styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#dc262618',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#dc2626',
                  flexShrink: 0,
                }}>
                <ExclamationCircleOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>
                  Failed ({formatCurrency(failedCost)} | {failedPercentage}%)
                </div>
                <div
                  style={{
                    color: '#111827',
                    fontSize: 22,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono), monospace',
                    lineHeight: 1.2,
                  }}>
                  {failedJobs.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      )}
    </Row>
  );
}
