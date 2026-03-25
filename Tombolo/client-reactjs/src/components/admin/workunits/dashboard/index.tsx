import { useState, useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme, Row, Col, Card, Spin, Alert } from 'antd';
import { ClusterOutlined, DashboardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import CostSummary, { type DashboardSummary } from './cards/CostSummary';
import { formatCurrency } from '@tombolo/shared';
import CostBarChart, { type DailyCost } from './cards/CostBarChart';
import CostByCluster, { type ClusterCost } from './cards/CostByEnvironment';
import ProblematicJobs, { type ProblematicJob } from './cards/ProblematicJobs';
import TopCostlyJobs from './cards/TopCostlyJobs';
import WorkunitTable from './cards/WorkunitTable';
import TimeRangeSelector, { type TimePreset } from './cards/TimeRangeSelector';
import workunitDashboardService, {
  type DashboardData,
  type OwnerCost,
  type ExpensiveWorkunit,
} from '@/services/workunitDashboard.service';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const [preset, setPreset] = useState<TimePreset>('30d');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(29, 'day').startOf('day'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('day'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await workunitDashboardService.getDashboardData({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError((err as Error).message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  const summary: DashboardSummary = dashboardData?.summary || {};
  const problematicJobs: ProblematicJob[] = dashboardData?.problematicJobs || [];
  const dailyCosts: DailyCost[] = dashboardData?.dailyCosts || [];
  const clusterCosts: ClusterCost[] = dashboardData?.clusterBreakdown || [];
  const ownerCosts: OwnerCost[] = dashboardData?.ownerBreakdown || [];
  const expensiveWorkunits: ExpensiveWorkunit[] = dashboardData?.expensiveWorkunits || [];

  const totalOwnerCost = useMemo(() => ownerCosts.reduce((sum, owner) => sum + owner.cost, 0), [ownerCosts]);

  const handlePresetChange = (p: TimePreset) => setPreset(p);
  const handleRangeChange = (start: Dayjs, end: Dayjs) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#3dd68c',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgLayout: '#f8fafc',
          colorBorder: '#e5e7eb',
          colorText: '#111827',
          colorTextSecondary: '#6b7280',
          borderRadius: 8,
          fontFamily: 'var(--font-sans), sans-serif',
        },
        components: {
          Card: {
            headerBg: 'transparent',
            colorBorderSecondary: '#e5e7eb',
          },
          Table: {
            colorBgContainer: '#ffffff',
            borderColor: '#e5e7eb',
          },
        },
      }}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <DashboardOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.headerTitle}>Workunit Dashboard</h1>
              <p className={styles.headerSubtitle}>Cost analytics and monitoring</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <ClusterOutlined className={styles.headerRightIcon} />
            <span className={styles.headerRightText}>{summary.totalJobs || 0} total workunits</span>
          </div>
        </header>

        {/* Content */}
        <main className={styles.main}>
          {/* Time Range Selector */}
          <div className={styles.timeRangeSelector}>
            <TimeRangeSelector
              preset={preset}
              startDate={startDate}
              endDate={endDate}
              onPresetChange={handlePresetChange}
              onRangeChange={handleRangeChange}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <p className={styles.loadingText}>Loading dashboard data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert
              message="Error Loading Dashboard"
              description={error}
              type="error"
              showIcon
              className={styles.errorAlert}
            />
          )}

          {/* Dashboard Content */}
          {!loading && !error && dashboardData && (
            <>
              {/* Cost Summary Stats */}
              <div className={styles.section}>
                <CostSummary summary={summary} />
              </div>

              {/* Top Costly Jobs */}
              {expensiveWorkunits.length > 0 && (
                <div className={styles.section}>
                  <TopCostlyJobs workunits={expensiveWorkunits} />
                </div>
              )}

              {/* Charts Row */}
              <Row gutter={[16, 16]} className={styles.section}>
                <Col xs={24} lg={14}>
                  <CostBarChart data={dailyCosts} />
                </Col>
                <Col xs={24} lg={10}>
                  <CostByCluster data={clusterCosts} />
                </Col>
              </Row>

              {/* Cost by Owner + Problematic Jobs */}
              <Row gutter={[16, 16]} className={styles.section}>
                <Col xs={24} lg={16}>
                  <Card
                    title={<span className={styles.costByOwnerTitle}>Cost by Owner</span>}
                    className={styles.costByOwnerCard}
                    styles={{ body: { padding: '16px 20px' } }}>
                    <div className={styles.ownerList}>
                      {ownerCosts.map(o => {
                        const pct = totalOwnerCost > 0 ? (o.cost / totalOwnerCost) * 100 : 0;
                        return (
                          <div key={o.owner} className={styles.ownerItem}>
                            <span className={styles.ownerName}>{o.owner}</span>
                            <div className={styles.ownerBarContainer}>
                              <div
                                className={styles.ownerBar}
                                style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }}
                              />
                            </div>
                            <span className={styles.ownerCost}>{formatCurrency(o.cost)}</span>
                            <span className={styles.ownerCount}>{o.count} jobs</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <ProblematicJobs jobs={problematicJobs} />
                </Col>
              </Row>

              {/* Workunit Table */}
              <div className={styles.workunitTableContainer}>
                <div className={styles.workunitTableHeader}>
                  <h2 className={styles.workunitTableTitle}>Workunits</h2>
                  <div className={styles.workunitTableLegend}>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${styles.legendSwatchCompute}`} />
                      Compute
                    </span>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${styles.legendSwatchFileAccess}`} />
                      File Access
                    </span>
                    <span className={styles.legendItem}>
                      <span className={`${styles.legendSwatch} ${styles.legendSwatchCompile}`} />
                      Compile
                    </span>
                  </div>
                </div>
                <WorkunitTable startDate={startDate.toISOString()} endDate={endDate.toISOString()} />
              </div>
            </>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}
