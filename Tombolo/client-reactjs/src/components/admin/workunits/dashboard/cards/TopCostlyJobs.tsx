import { useState, useMemo } from 'react';
import { Card, Table, Progress, Space, Tag, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { formatCurrency } from '@tombolo/shared';
import { groupWorkunitsByName } from '@/components/admin/workunitHistory/common/fuzzyMatch';
import type { ExpensiveWorkunit } from '@/services/workunitDashboard.service';

interface TopCostlyJobsProps {
  workunits: ExpensiveWorkunit[];
}

interface JobGroup {
  key: string;
  groupName: string;
  count: number;
  totalCost: number;
  workunits: ExpensiveWorkunit[];
}

export default function TopCostlyJobs({ workunits }: TopCostlyJobsProps) {
  const history = useHistory();
  const [showAll, setShowAll] = useState(false);

  // Group workunits using fuzzy matching and aggregate costs
  const jobGroups = useMemo(() => {
    if (!workunits || workunits.length === 0) return [];

    // Use fuzzy matching to group similar job names (client-side)
    const grouped = groupWorkunitsByName(workunits, 0.8);

    // Convert to array format and aggregate costs
    const groups: JobGroup[] = Object.entries(grouped).map(([groupName, wus]) => {
      const workunitArray = wus as ExpensiveWorkunit[];
      const totalCost = workunitArray.reduce((sum, wu) => sum + (wu.totalCost || 0), 0);

      return {
        key: groupName,
        groupName: groupName || 'Unnamed',
        count: workunitArray.length,
        totalCost,
        workunits: workunitArray.sort(
          (a, b) => new Date(b.workUnitTimestamp).getTime() - new Date(a.workUnitTimestamp).getTime()
        ),
      };
    });

    // Sort by total cost descending
    return groups.sort((a, b) => b.totalCost - a.totalCost);
  }, [workunits]);

  const totalDashboardCost = useMemo(() => {
    return workunits.reduce((sum, wu) => sum + (wu.totalCost || 0), 0);
  }, [workunits]);

  const displayedGroups = showAll ? jobGroups.slice(0, 10) : jobGroups.slice(0, 5);

  const handleView = (record: ExpensiveWorkunit) => {
    history.push(`/workunits/history/${record.clusterId}/${record.wuId}`);
  };

  // Main table columns (parent rows - job groups)
  const groupColumns = [
    {
      title: 'Job Name Group',
      dataIndex: 'groupName',
      key: 'groupName',
      ellipsis: true,
      render: (text: string, record: JobGroup) => (
        <Space size={4} align="center">
          <span style={{ fontWeight: 600, color: '#111827' }}>{text}</span>
          <Tag color="blue">
            {record.count} job{record.count !== 1 ? 's' : ''}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 150,
      render: (cost: number) => <span style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(cost)}</span>,
    },
    {
      title: 'Cost Share',
      key: 'progress',
      width: 200,
      render: (_: any, record: JobGroup) => {
        const percentage = totalDashboardCost > 0 ? (record.totalCost / totalDashboardCost) * 100 : 0;
        // Color code by magnitude
        const color = percentage > 70 ? '#dc2626' : percentage > 30 ? '#d97706' : '#16a34a';
        return (
          <Tooltip title={`${percentage.toFixed(1)}% of total cost`}>
            <Progress percent={percentage} showInfo={false} strokeColor={color} trailColor="#f3f4f6" size="small" />
          </Tooltip>
        );
      },
    },
  ];

  // Nested table columns (child rows - individual workunits)
  // Reusing exact structure from workunit history nested table
  const nestedColumns = [
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
      ellipsis: true,
      render: (text: string, record: ExpensiveWorkunit) => (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto', fontWeight: 600 }}
          onClick={() => handleView(record)}
          disabled={!record.detailsFetchedAt}>
          {text || record.wuId}
        </Button>
      ),
    },
    {
      title: 'WU ID',
      dataIndex: 'wuId',
      key: 'wuId',
      width: 220,
      ellipsis: true,
      render: (text: string, record: ExpensiveWorkunit) => (
        <Space size={4} align="center">
          <span style={{ fontSize: 12 }}>{text}</span>
          {!record.detailsFetchedAt && (
            <Tooltip title="Details not yet fetched">
              <Tag color="default">Not Fetched</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 80,
      ellipsis: true,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 80,
      render: (state: string) => {
        const colorMap: Record<string, string> = {
          completed: 'success',
          failed: 'error',
          running: 'processing',
          aborted: 'warning',
        };
        return <Tag color={colorMap[state] || 'default'}>{state ? state.toUpperCase() : 'UNKNOWN'}</Tag>;
      },
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 80,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: ExpensiveWorkunit) => (
        <Tooltip title={!record.detailsFetchedAt ? 'Details not yet fetched' : ''}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            disabled={!record.detailsFetchedAt}>
            Details
          </Button>
        </Tooltip>
      ),
    },
  ];

  if (jobGroups.length === 0) {
    return null;
  }

  return (
    <Card
      title={<span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Top Costly Jobs</span>}
      style={{
        background: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
      }}
      styles={{ body: { padding: '16px 20px' } }}>
      <Table
        columns={groupColumns}
        dataSource={displayedGroups}
        pagination={false}
        scroll={{ y: 400 }}
        size="small"
        expandable={{
          expandedRowRender: (record: JobGroup) => (
            <Table
              columns={nestedColumns}
              dataSource={record.workunits}
              pagination={false}
              size="small"
              rowKey="wuId"
              style={{ marginLeft: 24 }}
            />
          ),
          rowExpandable: () => true,
        }}
      />
      {jobGroups.length > 5 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="link" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : `View More (${Math.min(jobGroups.length, 10)} total)`}
          </Button>
        </div>
      )}
    </Card>
  );
}
