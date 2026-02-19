import { useState, useEffect } from 'react';
import { ConfigProvider, theme as antdTheme, Row, Col, Card, Spin, Alert } from 'antd';
import { ClusterOutlined, DashboardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
// import type { Dayjs } from "dayjs";

import CostSummary from './cards/CostSummary';
import CostBarChart from './cards/CostBarChart';
import CostByCluster from './cards/CostByEnvironment';
import ProblematicJobs from './cards/ProblematicJobs';
import WorkunitTable from './cards/WorkunitTable';
import TimeRangeSelector from './cards/TimeRangeSelector';
import workunitDashboardService from '@/services/workunitDashboard.service';
// import type { TimePreset } from "./cards/TimeRangeSelector";

export default function DashboardPage() {
  const [preset, setPreset] = useState('30d');
  const [startDate, setStartDate] = useState(dayjs().subtract(29, 'day').startOf('day'));
  const [endDate, setEndDate] = useState(dayjs().endOf('day'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await workunitDashboardService.getDashboardData({
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
        });
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  const summary = dashboardData?.summary || {};
  const workunits = dashboardData?.workunits || [];
  const problematicJobs = dashboardData?.problematicJobs || [];
  const dailyCosts = dashboardData?.dailyCosts || [];
  const clusterCosts = dashboardData?.clusterBreakdown || [];
  const ownerCosts = dashboardData?.ownerBreakdown || [];

  const handlePresetChange = p => setPreset(p);
  const handleRangeChange = (start, end) => {
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
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          padding: '0 0 40px',
        }}>
        {/* Header */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DashboardOutlined style={{ fontSize: 22, color: '#3dd68c' }} />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.2,
                }}>
                Workunit Dashboard
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: '#6b7280',
                }}>
                Cost analytics and monitoring
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClusterOutlined style={{ color: '#6b7280' }} />
            <span style={{ color: '#6b7280', fontSize: 12 }}>{summary.totalJobs || 0} total workunits</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}>
          {/* Time Range Selector */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              padding: '14px 20px',
              marginBottom: 24,
            }}>
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
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, color: '#6b7280' }}>Loading dashboard data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert
              message="Error Loading Dashboard"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Dashboard Content */}
          {!loading && !error && dashboardData && (
            <>
              {/* Cost Summary Stats */}
              <div style={{ marginBottom: 24 }}>
                <CostSummary workunits={workunits} summary={summary} />
              </div>

              {/* Charts Row */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={14}>
                  <CostBarChart data={dailyCosts} />
                </Col>
                <Col xs={24} lg={10}>
                  <CostByCluster data={clusterCosts} />
                </Col>
              </Row>

              {/* Cost by Owner + Problematic Jobs */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={16}>
                  <Card
                    title={
                      <span
                        style={{
                          color: '#111827',
                          fontWeight: 600,
                          fontSize: 15,
                        }}>
                        Cost by Owner
                      </span>
                    }
                    style={{
                      background: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: 8,
                    }}
                    styles={{ body: { padding: '16px 20px' } }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}>
                      {ownerCosts.map(o => {
                        const totalOwnerCost = ownerCosts.reduce((s, x) => s + x.cost, 0);
                        const pct = totalOwnerCost > 0 ? (o.cost / totalOwnerCost) * 100 : 0;
                        return (
                          <div
                            key={o.owner}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                            }}>
                            <span
                              style={{
                                color: '#6b7280',
                                fontSize: 13,
                                width: 120,
                                flexShrink: 0,
                              }}>
                              {o.owner}
                            </span>
                            <div
                              style={{
                                flex: 1,
                                height: 20,
                                background: '#f3f4f6',
                                borderRadius: 4,
                                overflow: 'hidden',
                                position: 'relative',
                              }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #3dd68c 0%, #2a9d68 100%)',
                                  borderRadius: 4,
                                  transition: 'width 0.4s ease',
                                  minWidth: pct > 0 ? 4 : 0,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                color: '#111827',
                                fontSize: 12,
                                fontFamily: 'var(--font-mono), monospace',
                                width: 70,
                                textAlign: 'right',
                                flexShrink: 0,
                              }}>
                              ${o.cost.toFixed(2)}
                            </span>
                            <span
                              style={{
                                color: '#6b7280',
                                fontSize: 11,
                                width: 50,
                                textAlign: 'right',
                                flexShrink: 0,
                              }}>
                              {o.count} jobs
                            </span>
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
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  padding: 20,
                }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}>
                  <h2
                    style={{
                      color: '#111827',
                      fontSize: 15,
                      fontWeight: 600,
                      margin: 0,
                    }}>
                    Workunits
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      fontSize: 11,
                      color: '#9ca3af',
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: '#16a34a',
                          display: 'inline-block',
                        }}
                      />
                      Compute
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: '#2563eb',
                          display: 'inline-block',
                        }}
                      />
                      File Access
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: '#d97706',
                          display: 'inline-block',
                        }}
                      />
                      Compile
                    </span>
                  </div>
                </div>
                <WorkunitTable workunits={workunits} />
              </div>
            </>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}
