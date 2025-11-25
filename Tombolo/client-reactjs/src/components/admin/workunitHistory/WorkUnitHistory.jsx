import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Typography,
  message,
  Tooltip,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import workunitsService from '@/services/workunits.service';
import clustersService from '@/services/clusters.service';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const formatTime = seconds => {
  if (seconds == null) return '-';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${mins}m ${secs}s`;
};

const WorkUnitHistory = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState('workUnitTimestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [clusters, setClusters] = useState([]);
  const [clusterMap, setClusterMap] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    clusterId: undefined,
    state: undefined,
    owner: undefined,
    jobName: undefined,
    dateRange: undefined,
    costAbove: undefined,
  });

  const [statistics, setStatistics] = useState({
    totalJobs: 0,
    totalCost: 0,
    avgTime: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      };

      // Apply filters
      if (filters.clusterId) queryParams.clusterId = filters.clusterId;
      if (filters.state) queryParams.state = filters.state;
      if (filters.owner) queryParams.owner = filters.owner;
      if (filters.jobName) queryParams.jobName = filters.jobName;
      if (filters.dateRange && filters.dateRange[0]) {
        queryParams.dateFrom = filters.dateRange[0].toISOString();
        queryParams.dateTo = filters.dateRange[1].toISOString();
      }
      if (filters.costAbove) queryParams.costAbove = filters.costAbove;

      const result = await workunitsService.getAll(queryParams);
      setData(result.data || []);
      setTotal(result.total || 0);

      // Calculate statistics
      if (result.data && result.data.length > 0) {
        const totalCost = result.data.reduce((sum, wu) => sum + (wu.totalCost || 0), 0);
        const avgTime = result.data.reduce((sum, wu) => sum + (wu.totalClusterTime || 0), 0) / result.data.length;
        setStatistics({
          totalJobs: result.total,
          totalCost,
          avgTime,
        });
      } else {
        setStatistics({
          totalJobs: 0,
          totalCost: 0,
          avgTime: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching workunits:', error);
      message.error('Failed to load workunit history');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortField,
    sortOrder,
    filters.clusterId,
    filters.state,
    filters.owner,
    filters.jobName,
    filters.dateRange,
    filters.costAbove,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch clusters on mount
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const clusterData = await clustersService.getAll();
        setClusters(clusterData || []);

        // Create a map from cluster ID to cluster name
        const map = {};
        (clusterData || []).forEach(cluster => {
          map[cluster.id] = cluster.name;
        });
        setClusterMap(map);
      } catch (error) {
        console.error('Error fetching clusters:', error);
      }
    };

    fetchClusters();
  }, []);

  const handleTableChange = (newPagination, _filters, sorter) => {
    setPage(newPagination.current);
    setLimit(newPagination.pageSize);

    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  const handleSearch = () => {
    setPage(1);
    // fetchData will be called by useEffect when page changes
    // If already on page 1, trigger manually
    if (page === 1) {
      fetchData();
    }
  };

  const handleReset = () => {
    setFilters({
      clusterId: undefined,
      state: undefined,
      owner: undefined,
      jobName: undefined,
      dateRange: undefined,
      costAbove: undefined,
    });
    setPage(1);
    // fetchData will be called by useEffect
  };

  const handleView = record => {
    history.push(`/admin/workunits/${record.wuId}`);
  };

  const columns = [
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || record.wuId}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.wuId}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Cluster',
      dataIndex: 'clusterId',
      key: 'clusterId',
      width: 120,
      render: clusterId => clusterMap[clusterId] || clusterId,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 100,
      render: state => {
        const colorMap = {
          completed: 'success',
          failed: 'error',
          running: 'processing',
          aborted: 'warning',
        };
        return <Tag color={colorMap[state] || 'default'}>{state ? state.toUpperCase() : 'UNKNOWN'}</Tag>;
      },
    },
    {
      title: 'Timestamp',
      dataIndex: 'workUnitTimestamp',
      key: 'workUnitTimestamp',
      width: 160,
      sorter: true,
      render: date => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: 'Total Time',
      dataIndex: 'totalClusterTime',
      key: 'totalClusterTime',
      width: 120,
      sorter: true,
      render: formatTime,
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      sorter: true,
      render: cost => (cost != null ? `$${cost.toFixed(4)}` : '-'),
    },
    {
      title: 'Details',
      dataIndex: 'hasDetails',
      key: 'hasDetails',
      width: 80,
      align: 'center',
      render: hasDetails =>
        hasDetails ? (
          <Tag color="green">Available</Tag>
        ) : (
          <Tooltip title="Details not yet fetched">
            <Tag color="default">N/A</Tag>
          </Tooltip>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>Workunit History</Title>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Jobs" value={statistics.totalJobs} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Cost"
              value={statistics.totalCost}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="USD"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Avg Time" value={formatTime(statistics.avgTime)} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Select
                placeholder="Select Cluster"
                value={filters.clusterId}
                onChange={value => setFilters({ ...filters, clusterId: value })}
                style={{ width: '100%' }}
                allowClear
                showSearch
                filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}>
                {clusters.map(cluster => (
                  <Option key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="State"
                value={filters.state}
                onChange={value => setFilters({ ...filters, state: value })}
                style={{ width: '100%' }}
                allowClear>
                <Option value="completed">Completed</Option>
                <Option value="failed">Failed</Option>
                <Option value="running">Running</Option>
                <Option value="aborted">Aborted</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="Owner"
                value={filters.owner}
                onChange={e => setFilters({ ...filters, owner: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="Job Name"
                value={filters.jobName}
                onChange={e => setFilters({ ...filters, jobName: e.target.value })}
                allowClear
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <RangePicker
                value={filters.dateRange}
                onChange={dates => setFilters({ ...filters, dateRange: dates })}
                style={{ width: '100%' }}
                showTime
              />
            </Col>
            <Col span={6}>
              <Input
                placeholder="Min Cost ($)"
                type="number"
                value={filters.costAbove}
                onChange={e => setFilters({ ...filters, costAbove: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Search
                </Button>
                <Button icon={<FilterOutlined />} onClick={handleReset}>
                  Reset
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="wuId"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            showSizeChanger: true,
            showTotal: total => `Total ${total} workunits`,
            pageSizeOptions: ['25', '50', '100', '200'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
};

export default WorkUnitHistory;
