import { useState, useMemo, useEffect } from 'react';
import { Modal, Select, Space, Typography, Alert, Empty, Row, Col, Card, Tag } from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  DotChartOutlined,
  AreaChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { Line, Column, Bar, Area, Pie, Scatter } from '@ant-design/plots';

const { Text } = Typography;

const CHART_TYPES = [
  { value: 'column', label: 'Column', icon: <BarChartOutlined /> },
  { value: 'bar', label: 'Bar', icon: <BarChartOutlined style={{ transform: 'rotate(90deg)' }} /> },
  { value: 'line', label: 'Line', icon: <LineChartOutlined /> },
  { value: 'area', label: 'Area', icon: <AreaChartOutlined /> },
  { value: 'pie', label: 'Pie', icon: <PieChartOutlined /> },
  { value: 'scatter', label: 'Scatter', icon: <DotChartOutlined /> },
];

// Chart types that benefit from sorting by Y value
const SORTED_CHARTS = new Set(['column', 'bar', 'pie']);

// Max slices before grouping into "Other" for pie charts
const MAX_PIE_SLICES = 15;

const ChartModal = ({ visible, onClose, data }) => {
  const [chartType, setChartType] = useState('column');
  const [xAxis, setXAxis] = useState(null);
  const [yAxis, setYAxis] = useState(null);

  // Reset selections when data changes
  useEffect(() => {
    if (data?.columns?.length > 0) {
      setXAxis(data.columns[0]);
      // Default Y to the first numeric-looking column, falling back to second column
      const numericCol = data.columns.find(col => {
        const sample = data.rows.slice(0, 5);
        return sample.some(row => row[col] != null && !isNaN(Number(row[col])));
      });
      setYAxis(numericCol || data.columns[1] || data.columns[0]);
    }
  }, [data]);

  // Check if Y axis is numeric
  const isYAxisNumeric = useMemo(() => {
    if (!data?.rows?.length || !yAxis) return false;
    const validRows = data.rows.filter(row => row[yAxis] != null);
    if (validRows.length === 0) return false;
    const numericCount = validRows.filter(row => !isNaN(Number(row[yAxis]))).length;
    return numericCount / validRows.length > 0.7;
  }, [data, yAxis]);

  // Transform, aggregate, and sort data for charts
  const chartData = useMemo(() => {
    if (!data?.rows?.length || !xAxis || !yAxis) return [];

    // Aggregate duplicate X values by summing Y
    const aggregated = new Map();
    for (const row of data.rows) {
      const key = String(row[xAxis] ?? '');
      const val = Number(row[yAxis]);
      const numVal = isNaN(val) ? 0 : val;

      if (aggregated.has(key)) {
        const entry = aggregated.get(key);
        entry.y += numVal;
        entry.count += 1;
      } else {
        aggregated.set(key, { x: key, y: numVal, count: 1 });
      }
    }

    let result = Array.from(aggregated.values()).map(entry => ({
      x: entry.x,
      y: Math.round(entry.y * 100) / 100, // Clean up floating point
      category: entry.x,
      value: Math.round(entry.y * 100) / 100,
    }));

    // Only sort by Y for chart types where it makes sense
    if (SORTED_CHARTS.has(chartType)) {
      result.sort((a, b) => a.y - b.y);
    }

    // For pie charts, bucket small slices into "Other"
    if (chartType === 'pie' && result.length > MAX_PIE_SLICES) {
      result.sort((a, b) => b.value - a.value); // Largest first
      const top = result.slice(0, MAX_PIE_SLICES - 1);
      const rest = result.slice(MAX_PIE_SLICES - 1);
      const otherValue = rest.reduce((sum, d) => sum + d.value, 0);
      top.push({
        x: `Other (${rest.length})`,
        y: Math.round(otherValue * 100) / 100,
        category: `Other (${rest.length})`,
        value: Math.round(otherValue * 100) / 100,
      });
      result = top;
    }

    return result;
  }, [data, xAxis, yAxis, chartType]);

  // Shared tooltip config using title callback + items array (v2 API)
  const buildTooltip = () => ({
    title: d => String(d.x ?? ''),
    items: [
      {
        field: 'y',
        name: yAxis || 'value',
      },
    ],
  });

  // Pie tooltip — category is the label, value is the numeric
  const buildPieTooltip = () => ({
    title: d => String(d.category ?? d.x ?? ''),
    items: [
      {
        field: 'value',
        name: yAxis || 'value',
      },
    ],
  });

  // Render chart
  const renderChart = () => {
    if (!chartData.length) {
      return <Empty description="No data to visualize" />;
    }

    if (!isYAxisNumeric && chartType !== 'pie') {
      return (
        <Alert
          message="Non-numeric Y-axis"
          description={`"${yAxis}" doesn't appear to contain numeric data. Select a numeric column for the Y-axis, or use a Pie chart.`}
          type="warning"
          showIcon
        />
      );
    }

    const base = {
      data: chartData,
      height: 450,
      animation: { appear: { animation: 'wave-in', duration: 800 } },
    };

    const tooltip = buildTooltip();

    switch (chartType) {
      case 'line':
        return (
          <Line
            {...base}
            xField="x"
            yField="y"
            point={{ size: 4, shape: 'circle' }}
            smooth
            tooltip={tooltip}
            xAxis={{ label: { autoRotate: true, autoHide: true } }}
          />
        );

      case 'column':
        return (
          <Column
            {...base}
            xField="x"
            yField="y"
            columnStyle={{ radius: [4, 4, 0, 0] }}
            tooltip={tooltip}
            xAxis={{ label: { autoRotate: true, autoHide: true } }}
            label={
              chartData.length <= 15
                ? {
                    position: 'top',
                    formatter: d => (d?.y != null ? d.y : ''),
                  }
                : false
            }
          />
        );

      case 'bar':
        return (
          <Bar
            {...base}
            xField="y"
            yField="x"
            barStyle={{ radius: [0, 4, 4, 0] }}
            tooltip={tooltip}
            yAxis={{ label: { autoHide: true } }}
          />
        );

      case 'area':
        return (
          <Area
            {...base}
            xField="x"
            yField="y"
            smooth
            tooltip={tooltip}
            xAxis={{ label: { autoRotate: true, autoHide: true } }}
          />
        );

      case 'pie':
        return (
          <Pie
            {...base}
            angleField="value"
            colorField="category"
            radius={0.8}
            innerRadius={0.5}
            label={{ type: 'outer', content: '{name} ({percentage})' }}
            interactions={[{ type: 'element-active' }]}
            tooltip={buildPieTooltip()}
            statistic={{
              title: { content: 'Total' },
              content: {
                formatter: (_datum, data) => {
                  const total = (data || []).reduce((sum, d) => sum + (d?.value ?? 0), 0);
                  return Math.round(total * 100) / 100;
                },
              },
            }}
          />
        );

      case 'scatter':
        return (
          <Scatter
            {...base}
            xField="x"
            yField="y"
            size={5}
            pointStyle={{ fillOpacity: 0.7, stroke: '#1890ff', lineWidth: 1 }}
            tooltip={tooltip}
            xAxis={{ label: { autoRotate: true, autoHide: true } }}
          />
        );

      default:
        return <Empty description="Unsupported chart type" />;
    }
  };

  if (!data?.columns?.length) {
    return (
      <Modal title="Visualize Data" open={visible} onCancel={onClose} footer={null} width={1400}>
        <Empty description="No data available to visualize" />
      </Modal>
    );
  }

  return (
    <Modal
      title="Visualize Data"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1400}
      bodyStyle={{ padding: '12px 16px' }}
      destroyOnClose>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Configuration */}
        <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Chart Type
              </Text>
              <Select value={chartType} onChange={setChartType} style={{ width: '100%' }} optionLabelProp="label">
                {CHART_TYPES.map(type => (
                  <Select.Option key={type.value} value={type.value} label={type.label}>
                    <Space>
                      {type.icon}
                      {type.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={7}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {chartType === 'pie' ? 'Category' : 'X-Axis'}
              </Text>
              <Select
                value={xAxis}
                onChange={setXAxis}
                style={{ width: '100%' }}
                showSearch
                placeholder="Select column">
                {data.columns.map(col => (
                  <Select.Option key={col} value={col}>
                    {col}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={7}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {chartType === 'pie' ? 'Value' : 'Y-Axis'}
              </Text>
              <Select
                value={yAxis}
                onChange={setYAxis}
                style={{ width: '100%' }}
                showSearch
                placeholder="Select column">
                {data.columns.map(col => (
                  <Select.Option key={col} value={col}>
                    {col}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={4} style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
              <Space size={4}>
                <Tag>{chartData.length} points</Tag>
                {!isYAxisNumeric && <Tag color="orange">Non-numeric</Tag>}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Chart */}
        <div style={{ minHeight: 450 }}>
          {xAxis && yAxis ? renderChart() : <Empty description="Select X and Y axes to visualize data" />}
        </div>
      </Space>
    </Modal>
  );
};

export default ChartModal;
