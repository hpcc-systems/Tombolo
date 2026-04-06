import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Space,
  Button,
  Tag,
  Select,
  Alert,
  Spin,
  Empty,
  Typography,
  Tooltip,
  message,
} from 'antd';
import { ClockCircleOutlined, LineChartOutlined, ReloadOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import workunitsService from '@/services/workunits.service';
import SwapIcon from '@/components/common/icons/SwapIcon';
import styles from '../../workunitHistory.module.css';
import { formatCurrency, formatPercentage } from '@tombolo/shared';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { Option } = Select;

type PerformanceIndicator = 'better' | 'worse' | 'similar';
type TimeRange = '7d' | '30d' | '90d' | 'all';

// Format seconds to readable duration
const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds === 0) return '-';
  return dayjs.duration(seconds, 'seconds').format('HH:mm:ss');
};

// Calculate percentage difference
const getPercentChange = (current: number | null | undefined, previous: number | null | undefined): number | null => {
  if (current == null || previous == null || previous === 0) return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return ((current - previous) / previous) * 100;
};

const roundToDecimals = (value: number, decimals = 2): number => {
  return Number(value.toFixed(decimals));
};

const renderChangeValue = (current: number, previous: number): React.ReactNode => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return '-';

  const roundedCurrent = roundToDecimals(current, 2);
  const roundedPrevious = roundToDecimals(previous, 2);

  if (roundedPrevious === 0) {
    return roundedCurrent === 0 ? <Text type="secondary">0.00%</Text> : '-';
  }

  const change = getPercentChange(roundedCurrent, roundedPrevious);
  if (change == null) return '-';
  if (Math.abs(change) < 1e-8) {
    return <Text type="secondary">0.00%</Text>;
  }

  const indicator = getPerformanceIndicator(change);
  if (indicator === 'similar') {
    return (
      <Text type="secondary">
        <SwapIcon size={12} title="Similar change" aria-label="Similar change" style={{ verticalAlign: 'middle' }} />~
        {formatPercentage(Math.abs(change))}
      </Text>
    );
  }
  if (indicator === 'better') {
    return (
      <Text type="success">
        <FallOutlined /> {formatPercentage(Math.abs(change))}
      </Text>
    );
  }
  return (
    <Text type="danger">
      <RiseOutlined /> +{formatPercentage(change)}
    </Text>
  );
};

// Determine if performance is better, worse, or similar
const getPerformanceIndicator = (percentChange: number | null): PerformanceIndicator | null => {
  if (percentChange === null) return null;
  if (Math.abs(percentChange) < 5) return 'similar'; // Within 5% is considered similar
  return percentChange > 0 ? 'worse' : 'better'; // Positive = slower = worse
};

interface Props {
  wu: any;
  clusterId?: string;
  clusterName?: string;
}

const HistoryPanel: React.FC<Props> = ({ wu, clusterId, clusterName }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);

  const fetchHistory = async () => {
    if (!wu?.jobName || !clusterId) {
      setError('No job name or cluster ID available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let startDate: string | null = null;
      if (timeRange !== 'all') {
        const days = parseInt(timeRange);
        startDate = dayjs().subtract(days, 'days').toISOString();
      }

      const data = await workunitsService.getJobHistoryWithStats(clusterId, wu.jobName, {
        startDate,
        limit: 100,
      });

      let runs: any[] = [];
      if (Array.isArray(data)) {
        runs = data;
      } else if (Array.isArray(data?.runs)) {
        runs = data.runs;
      } else if (Array.isArray(data?.data?.runs)) {
        runs = data.data.runs;
      }

      if (!runs.length) {
        const fallback = await workunitsService.getJobHistory(clusterId, wu.jobName, {
          startDate,
          limit: 100,
        });
        runs = Array.isArray(fallback) ? fallback : fallback?.runs || [];
      }

      setHistory(runs);
    } catch (err: any) {
      setError(err.message || 'Failed to load job history');
      message.error('Failed to load job history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wu?.jobName && clusterId) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [wu?.jobName, clusterId, timeRange]);

  // Filter history
  const filteredHistory = useMemo(() => {
    const data = [...history];
    const filtered = showOnlyCompleted ? data.filter(item => item.state === 'completed') : data;
    return filtered.sort((a, b) => dayjs(b.workUnitTimestamp).diff(dayjs(a.workUnitTimestamp)));
  }, [history, showOnlyCompleted]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return { totalRuns: 0, successRate: 0, avgDuration: 0, minDuration: 0, maxDuration: 0, avgCost: 0 };
    }

    const completed = filteredHistory.filter(h => h.state === 'completed');
    const durations = completed.map((h: any) => h.totalClusterTime).filter((d: any) => d != null);
    const costs = completed
      .map((h: any) => h.totalCost)
      .filter((c: any) => c != null)
      .map((c: number) => roundToDecimals(c, 2));

    return {
      totalRuns: filteredHistory.length,
      successRate: filteredHistory.length > 0 ? (completed.length / filteredHistory.length) * 100 : 0,
      avgDuration: durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      avgCost:
        costs.length > 0 ? roundToDecimals(costs.reduce((a: number, b: number) => a + b, 0) / costs.length, 2) : 0,
    };
  }, [filteredHistory]);

  // Performance comparison with previous run
  const comparison = useMemo(() => {
    if (!wu || filteredHistory.length < 2) return null;

    const currentIndex = filteredHistory.findIndex((h: any) => h.wuId === wu.wuId);
    if (currentIndex === -1 || currentIndex === filteredHistory.length - 1) return null;

    const previous = filteredHistory[currentIndex + 1];
    const durationChange = getPercentChange(wu.totalClusterTime, previous.totalClusterTime);
    const costChange =
      wu.totalCost == null || previous.totalCost == null
        ? null
        : getPercentChange(roundToDecimals(wu.totalCost, 2), roundToDecimals(previous.totalCost, 2));

    return {
      previous,
      durationChange,
      costChange,
      durationIndicator: getPerformanceIndicator(durationChange),
      costIndicator: getPerformanceIndicator(costChange),
    };
  }, [wu, filteredHistory]);

  // Chart data for trend
  const chartData = useMemo(() => {
    return filteredHistory
      .filter((h: any) => h.state === 'completed' && h.totalClusterTime != null)
      .reverse()
      .map((h: any) => ({
        date: dayjs(h.workUnitTimestamp).format('MM/DD HH:mm'),
        duration: h.totalClusterTime,
        wuId: h.wuId,
        isCurrent: h.wuId === wu?.wuId,
      }));
  }, [filteredHistory, wu]);

  const previousRunMap = useMemo(() => {
    const map = new Map<string, any>();
    for (let i = 0; i < filteredHistory.length - 1; i += 1) {
      const current = filteredHistory[i];
      const previous = filteredHistory[i + 1];
      if (current?.wuId && previous) {
        map.set(current.wuId, previous);
      }
    }
    return map;
  }, [filteredHistory]);

  // Table columns
  const columns = [
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'WUID',
      dataIndex: 'wuId',
      key: 'wuId',
      width: 180,
      ellipsis: true,
      render: (wuId: string, record: any) => (
        <Space>
          <Text
            copyable
            strong={record.wuId === wu?.wuId}
            style={{ color: record.wuId === wu?.wuId ? '#1890ff' : undefined }}>
            {wuId}
          </Text>
          {record.wuId === wu?.wuId && <Tag color="blue">Current</Tag>}
        </Space>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'workUnitTimestamp',
      key: 'workUnitTimestamp',
      width: 80,
      ellipsis: true,
      render: (timestamp: string) => (
        <Tooltip title={dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}>
          <Text>{dayjs(timestamp).fromNow()}</Text>
        </Tooltip>
      ),
    },

    {
      title: 'Duration',
      dataIndex: 'totalClusterTime',
      key: 'totalClusterTime',
      width: 120,
      render: (time: number | null) => {
        if (time == null) return '-';
        const diff = statistics.avgDuration > 0 ? getPercentChange(time, statistics.avgDuration) : null;
        const indicator = getPerformanceIndicator(diff);
        return (
          <Space>
            <Text>{formatDuration(time)}</Text>
            {indicator === 'worse' && (diff ?? 0) > 20 && (
              <Tooltip title={`${formatPercentage(diff ?? 0)} slower than average`}>
                <RiseOutlined style={{ color: '#ff4d4f' }} />
              </Tooltip>
            )}
            {indicator === 'better' && (diff ?? 0) < -20 && (
              <Tooltip title={`${formatPercentage(Math.abs(diff ?? 0))} faster than average`}>
                <FallOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      ellipsis: true,
      render: (cost: number | null) => (cost != null ? formatCurrency(cost) : '-'),
    },
    {
      title: 'vs Avg Cost',
      key: 'avgCostComparison',
      width: 140,
      ellipsis: true,
      render: (_: any, record: any) => {
        if (record.totalCost == null) return '-';
        const currentCost = roundToDecimals(record.totalCost, 2);
        if (statistics.avgCost === 0) {
          return currentCost === 0 ? <Text type="secondary">0.00%</Text> : '-';
        }
        return renderChangeValue(currentCost, statistics.avgCost);
      },
    },
    {
      title: 'Cost vs Previous',
      key: 'comparison',
      width: 120,
      ellipsis: true,
      render: (_: any, record: any) => {
        const previous = record?.wuId ? previousRunMap.get(record.wuId) : undefined;
        if (!previous || record.totalCost == null || previous.totalCost == null) return '-';

        const currentCost = roundToDecimals(record.totalCost, 2);
        const previousCost = roundToDecimals(previous.totalCost, 2);
        return renderChangeValue(currentCost, previousCost);
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      width: 100,
      ellipsis: true,
      render: (state: string) => {
        const config: Record<string, { color: string }> = {
          completed: { color: 'success' },
          failed: { color: 'error' },
          running: { color: 'processing' },
          aborted: { color: 'default' },
        };
        const { color } = config[state] || config.aborted;
        return <Tag color={color}>{state.toUpperCase()}</Tag>;
      },
    },
  ];

  const chartConfig = {
    data: chartData,
    xField: 'date',
    yField: 'duration',
    point: {
      size: (datum: any) => (datum.isCurrent ? 8 : 4),
      shape: 'circle',
      style: (datum: any) => ({
        fill: datum.isCurrent ? '#1890ff' : '#52c41a',
        stroke: datum.isCurrent ? '#096dd9' : '#389e0d',
        lineWidth: 2,
      }),
    },
    tooltip: {
      customContent: (title: string, items: any[]) => {
        if (!items || items.length === 0) return '';
        const data = items[0]?.data;
        return `
          <div style="padding: 8px 12px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${data?.wuId}</div>
            <div>Date: ${title}</div>
            <div>Duration: ${formatDuration(data?.duration)}</div>
            ${data?.isCurrent ? '<div style="color: #1890ff; margin-top: 4px;">← Current Run</div>' : ''}
          </div>
        `;
      },
    },
    smooth: true,
    animation: { appear: { animation: 'path-in', duration: 1000 } },
    xAxis: { label: { autoRotate: true } },
    yAxis: { label: { formatter: (v: number) => formatDuration(v) } },
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Loading job history..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Error Loading History"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchHistory}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (!wu?.jobName) {
    return (
      <Card>
        <Empty description="No previous runs available for this workunit" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Header with job name */}
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Job History: {wu.jobName}
            </Title>
            <Text type="secondary">
              Showing {filteredHistory.length} run{filteredHistory.length !== 1 ? 's' : ''} on {clusterName}
            </Text>
          </Col>
          <Col>
            <Space>
              <Select value={timeRange} onChange={v => setTimeRange(v as TimeRange)} style={{ width: 120 }}>
                <Option value="7d">Last 7 days</Option>
                <Option value="30d">Last 30 days</Option>
                <Option value="90d">Last 90 days</Option>
                <Option value="all">All time</Option>
              </Select>
              <Button
                type={showOnlyCompleted ? 'primary' : 'default'}
                onClick={() => setShowOnlyCompleted(!showOnlyCompleted)}>
                {showOnlyCompleted ? 'Show All' : 'Completed Only'}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchHistory}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Performance comparison with previous run */}
      {comparison && (
        <Card>
          <Alert
            message="Comparison with Previous Run"
            description={
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Space>
                      <Text strong>Duration:</Text>
                      {comparison.durationChange == null || comparison.durationIndicator == null ? (
                        <Text type="secondary">-</Text>
                      ) : comparison.durationIndicator === 'better' ? (
                        <Text type="success">
                          <FallOutlined /> {formatPercentage(Math.abs(comparison.durationChange))} faster
                        </Text>
                      ) : comparison.durationIndicator === 'worse' ? (
                        <Text type="danger">
                          <RiseOutlined /> {formatPercentage(comparison.durationChange)} slower
                        </Text>
                      ) : (
                        <Text type="secondary">
                          <SwapIcon size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Similar (~
                          {formatPercentage(Math.abs(comparison.durationChange))})
                        </Text>
                      )}
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Text strong>Cost:</Text>
                      {comparison.costChange == null || comparison.costIndicator == null ? (
                        <Text type="secondary">-</Text>
                      ) : comparison.costIndicator === 'better' ? (
                        <Text type="success">
                          <FallOutlined /> {formatPercentage(Math.abs(comparison.costChange))} cheaper
                        </Text>
                      ) : comparison.costIndicator === 'worse' ? (
                        <Text type="danger">
                          <RiseOutlined /> {formatPercentage(comparison.costChange)} more expensive
                        </Text>
                      ) : (
                        <Text type="secondary">
                          <SwapIcon size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Similar (~
                          {formatPercentage(Math.abs(comparison.costChange))})
                        </Text>
                      )}
                    </Space>
                  </Col>
                </Row>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Previous run: {comparison.previous.wuId} •{' '}
                  {dayjs(comparison.previous.workUnitTimestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </Space>
            }
            type={comparison.durationIndicator === 'worse' || comparison.costIndicator === 'worse' ? 'warning' : 'info'}
            showIcon
          />
        </Card>
      )}

      {/* Summary statistics */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
          {/* <Row gutter={[16, 16]}> */}
          <Card size="small" className={styles.summaryCard}>
            <Statistic title="Total Runs" value={statistics.totalRuns} prefix={<LineChartOutlined />} />
          </Card>
          <Card size="small" className={styles.summaryCard}>
            <Statistic
              title="Success Rate"
              value={statistics.successRate}
              precision={2}
              suffix="%"
              valueStyle={{
                color: statistics.successRate >= 95 ? '#52c41a' : statistics.successRate >= 80 ? '#faad14' : '#ff4d4f',
              }}
            />
          </Card>
          <Card size="small" className={styles.summaryCard}>
            <Statistic
              title="Avg Duration"
              value={formatDuration(statistics.avgDuration)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
          <Card size="small" className={styles.summaryCard}>
            <Statistic title="Avg Cost" value={formatCurrency(statistics.avgCost)} />
          </Card>
          {/* </Row> */}
          {/* <Row gutter={[16, 16]} style={{ marginTop: 16 }}> */}
          <Card size="small" className={styles.summaryCard}>
            <Statistic
              title="Fastest Run"
              value={formatDuration(statistics.minDuration)}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
          <Card size="small" className={styles.summaryCard}>
            <Statistic
              title="Slowest Run"
              value={formatDuration(statistics.maxDuration)}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
          <Card size="small" className={styles.summaryCard}>
            <Statistic
              title="Duration Range"
              value={formatDuration(statistics.maxDuration - statistics.minDuration)}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
          {/* </Row> */}
        </div>
      </Card>

      {/* Performance trend chart */}
      {chartData.length > 1 && (
        <Card
          title={
            <Space>
              <LineChartOutlined /> Performance Trend
            </Space>
          }>
          <Line {...chartConfig} height={300} />
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Showing duration trend for the last {chartData.length} completed runs
            </Text>
          </div>
        </Card>
      )}

      {/* History table */}
      <Card title="Run History">
        <Table
          size="small"
          dataSource={filteredHistory}
          columns={columns}
          rowKey="wuId"
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} runs`,
          }}
          rowClassName={(record: any) => (record.wuId === wu?.wuId ? styles.highlightRow : '')}
          onRow={(record: any) => ({
            onClick: () => {
              if (record.wuId !== wu?.wuId) {
                window.open(`/workunits/history/${clusterId}/${record.wuId}`, '_blank');
              }
            },
            style: { cursor: record.wuId !== wu?.wuId ? 'pointer' : 'default' },
          })}
        />
      </Card>
    </Space>
  );
};

export default HistoryPanel;
