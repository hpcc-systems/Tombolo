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
import styles from './CostSummary.module.css';

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
    <Row gutter={[16, 16]} className={styles.statsRow}>
      {stats.map(stat => (
        <Col xs={24} sm={12} lg={6} className={styles.statCol} key={stat.title}>
          <Card className={styles.statCard} styles={{ body: { padding: '16px 20px' } }}>
            <div className={styles.statContent}>
              <div
                className={styles.iconContainer}
                style={{ background: `${stat.color}18`, color: stat.color }}>
                {stat.icon}
              </div>
              <Statistic
                title={<span className={styles.statTitle}>{stat.title}</span>}
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
        <Col xs={24} sm={12} lg={6} className={styles.statCol}>
          <Card className={styles.failedCard} styles={{ body: { padding: '16px 20px' } }}>
            <div className={styles.statContent}>
              <div className={styles.failedIconContainer}>
                <ExclamationCircleOutlined />
              </div>
              <div className={styles.failedContent}>
                <div className={styles.failedTitle}>
                  Failed ({formatCurrency(failedCost)} | {failedPercentage}%)
                </div>
                <div className={styles.failedValue}>{failedJobs.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
      )}
    </Row>
  );
}
