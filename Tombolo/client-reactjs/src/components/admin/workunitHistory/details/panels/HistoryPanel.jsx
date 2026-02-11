import { useState, useEffect, useMemo } from 'react';
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
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import workunitsService from '@/services/workunits.service';
import styles from '../../workunitHistory.module.css';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { Option } = Select;

// Format seconds to readable duration
const formatDuration = seconds => {
  if (seconds == null || seconds === 0) return '-';
  return dayjs.duration(seconds, 'seconds').format('HH:mm:ss');
};

// Calculate percentage difference
const getPercentChange = (current, previous) => {
  if (current == null || previous == null || previous === 0) return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return ((current - previous) / previous) * 100;
};

// Determine if performance is better, worse, or similar
const getPerformanceIndicator = percentChange => {
  if (percentChange === null) return null;
  if (Math.abs(percentChange) < 5) return 'similar'; // Within 5% is considered similar
  return percentChange > 0 ? 'worse' : 'better'; // Positive = slower = worse
};

const HistoryPanel = ({ wu, clusterId, clusterName }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);

  const fetchHistory = async () => {
    if (!wu?.jobName) {
      setError('No job name available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      let startDate = null;
      if (timeRange !== 'all') {
        const days = parseInt(timeRange);
        startDate = dayjs().subtract(days, 'days').toISOString();
      }

      const data = await workunitsService.getJobHistory(clusterId, wu.jobName, {
        startDate,
        limit: 100,
      });
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching job history:', err);
      setError(err.message || 'Failed to load job history');
      message.error('Failed to load job history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wu?.jobName) {
      fetchHistory();
    } else {
      // No jobName available — ensure we stop showing the global loading spinner
      setLoading(false);
    }
  }, [wu?.jobName, timeRange]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let data = [...history];

    if (showOnlyCompleted) {
      data = data.filter(item => item.state === 'completed');
    }

    return data;
  }, [history, showOnlyCompleted]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        avgCost: 0,
      };
    }

    const completed = filteredHistory.filter(h => h.state === 'completed');
    const durations = completed.map(h => h.totalClusterTime).filter(d => d != null);
    const costs = filteredHistory.map(h => h.totalCost).filter(c => c != null);

    return {
      totalRuns: filteredHistory.length,
      successRate: filteredHistory.length > 0 ? (completed.length / filteredHistory.length) * 100 : 0,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
    };
  }, [filteredHistory]);

  // Performance comparison with previous run
  const comparison = useMemo(() => {
    if (!wu || filteredHistory.length < 2) return null;

    // Find current workunit in history
    const currentIndex = filteredHistory.findIndex(h => h.wuId === wu.wuId);
    if (currentIndex === -1 || currentIndex === filteredHistory.length - 1) return null;

    const previous = filteredHistory[currentIndex + 1];
    const durationChange = getPercentChange(wu.totalClusterTime, previous.totalClusterTime);
    const costChange = getPercentChange(wu.totalCost, previous.totalCost);

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
      .filter(h => h.state === 'completed' && h.totalClusterTime != null)
      .reverse() // Oldest first for chronological order
      .map(h => ({
        date: dayjs(h.workUnitTimestamp).format('MM/DD HH:mm'),
        duration: h.totalClusterTime,
        wuId: h.wuId,
        isCurrent: h.wuId === wu?.wuId,
      }));
  }, [filteredHistory, wu]);

  // Table columns
  const columns = [
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      width: 100,
      render: state => {
        const config = {
          completed: { color: 'success', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', icon: <CloseCircleOutlined /> },
          running: { color: 'processing', icon: <ClockCircleOutlined /> },
          aborted: { color: 'default', icon: <WarningOutlined /> },
        };
        const { color, icon } = config[state] || config.aborted;
        return (
          <Tag color={color} icon={icon}>
            {state.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'WUID',
      dataIndex: 'wuId',
      key: 'wuId',
      width: 180,
      render: (wuId, record) => (
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
      width: 180,
      render: timestamp => (
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
      render: (time, _record) => {
        if (time == null) return '-';

        // Compare to average
        const diff = statistics.avgDuration > 0 ? getPercentChange(time, statistics.avgDuration) : null;
        const indicator = getPerformanceIndicator(diff);

        return (
          <Space>
            <Text>{formatDuration(time)}</Text>
            {indicator === 'worse' && diff > 20 && (
              <Tooltip title={`${Number(diff ?? 0).toFixed(1)}% slower than average`}>
                <RiseOutlined style={{ color: '#ff4d4f' }} />
              </Tooltip>
            )}
            {indicator === 'better' && diff < -20 && (
              <Tooltip title={`${Number(Math.abs(diff) ?? 0).toFixed(1)}% faster than average`}>
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
      render: cost => (cost != null ? `$${cost.toFixed(4)}` : '-'),
    },
    {
      title: 'vs Previous',
      key: 'comparison',
      width: 120,
      render: (_, record, index) => {
        if (index === filteredHistory.length - 1) return '-'; // No previous run

        const previous = filteredHistory[index + 1];
        if (!previous || record.totalClusterTime == null || previous.totalClusterTime == null) return '-';

        const change = getPercentChange(record.totalClusterTime, previous.totalClusterTime);
        const indicator = getPerformanceIndicator(change);

        if (indicator === 'similar') {
          return (
            <Text type="secondary">
              <SwapOutlined /> ~{Number(Math.abs(change) ?? 0).toFixed(1)}%
            </Text>
          );
        }

        if (indicator === 'better') {
          return (
            <Text type="success">
              <FallOutlined /> {Number(Math.abs(change) ?? 0).toFixed(1)}%
            </Text>
          );
        }

        return (
          <Text type="danger">
            <RiseOutlined /> +{Number(change ?? 0).toFixed(1)}%
          </Text>
        );
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
      ellipsis: true,
    },
  ];

  const chartConfig = {
    data: chartData,
    xField: 'date',
    yField: 'duration',
    point: {
      size: datum => (datum.isCurrent ? 8 : 4),
      shape: 'circle',
      style: datum => ({
        fill: datum.isCurrent ? '#1890ff' : '#52c41a',
        stroke: datum.isCurrent ? '#096dd9' : '#389e0d',
        lineWidth: 2,
      }),
    },
    tooltip: {
      customContent: (title, items) => {
        if (!items || items.length === 0) return '';
        const item = items[0];
        const data = item?.data;
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
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
    yAxis: {
      label: {
        formatter: v => formatDuration(v),
      },
    },
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
              <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
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
                      {comparison.durationIndicator === 'better' ? (
                        <Text type="success">
                          <FallOutlined /> {Number(Math.abs(comparison.durationChange) ?? 0).toFixed(1)}% faster
                        </Text>
                      ) : comparison.durationIndicator === 'worse' ? (
                        <Text type="danger">
                          <RiseOutlined /> {Number(comparison.durationChange ?? 0).toFixed(1)}% slower
                        </Text>
                      ) : (
                        <Text type="secondary">
                          <SwapOutlined /> Similar (~{Number(Math.abs(comparison.durationChange) ?? 0).toFixed(1)}%)
                        </Text>
                      )}
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Text strong>Cost:</Text>
                      {comparison.costIndicator === 'better' ? (
                        <Text type="success">
                          <FallOutlined /> {Number(Math.abs(comparison.costChange) ?? 0).toFixed(1)}% cheaper
                        </Text>
                      ) : comparison.costIndicator === 'worse' ? (
                        <Text type="danger">
                          <RiseOutlined /> {Number(comparison.costChange ?? 0).toFixed(1)}% more expensive
                        </Text>
                      ) : (
                        <Text type="secondary">
                          <SwapOutlined /> Similar (~{Number(Math.abs(comparison.costChange) ?? 0).toFixed(1)}%)
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
      <Card title="Summary Statistics">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic title="Total Runs" value={statistics.totalRuns} prefix={<LineChartOutlined />} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Success Rate"
              value={statistics.successRate}
              precision={1}
              suffix="%"
              valueStyle={{
                color: statistics.successRate >= 95 ? '#52c41a' : statistics.successRate >= 80 ? '#faad14' : '#ff4d4f',
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Avg Duration"
              value={formatDuration(statistics.avgDuration)}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Avg Cost" value={statistics.avgCost} precision={4} prefix="$" />
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={12} sm={8}>
            <Statistic
              title="Fastest Run"
              value={formatDuration(statistics.minDuration)}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Slowest Run"
              value={formatDuration(statistics.maxDuration)}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title="Duration Range"
              value={formatDuration(statistics.maxDuration - statistics.minDuration)}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
        </Row>
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
          dataSource={filteredHistory}
          columns={columns}
          rowKey="wuId"
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} runs`,
          }}
          rowClassName={record => (record.wuId === wu?.wuId ? styles.highlightRow : '')}
          onRow={record => ({
            onClick: () => {
              if (record.wuId !== wu?.wuId) {
                window.open(`/workunits/history/${clusterId}/${record.wuId}`, '_blank');
              }
            },
            style: {
              cursor: record.wuId !== wu?.wuId ? 'pointer' : 'default',
            },
          })}
        />
      </Card>
    </Space>
  );
};

export default HistoryPanel;
