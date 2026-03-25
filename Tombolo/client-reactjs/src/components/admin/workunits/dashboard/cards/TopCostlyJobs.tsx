import { useState, useMemo } from 'react';
import { Card, Table, Space, Tag, Button, Tooltip } from 'antd';
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
  executeCost: number;
  fileAccessCost: number;
  compileCost: number;
  workunits: ExpensiveWorkunit[];
}

// Cost breakdown bar component
const CostBreakdownBar = ({
  compute,
  fileAccess,
  compile,
}: {
  compute: number;
  fileAccess: number;
  compile: number;
}) => {
  const total = compute + fileAccess + compile;
  if (total === 0) return null;

  const cPct = (compute / total) * 100;
  const fPct = (fileAccess / total) * 100;

  return (
    <Tooltip
      title={
        <div>
          <div>Compute: {formatCurrency(compute)}</div>
          <div>File Access: {formatCurrency(fileAccess)}</div>
          <div>Compile: {formatCurrency(compile)}</div>
        </div>
      }>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          background: '#f3f4f6',
        }}>
        <div
          style={{
            width: `${cPct}%`,
            background: '#16a34a',
            transition: 'width 0.3s',
          }}
        />
        <div
          style={{
            width: `${fPct}%`,
            background: '#2563eb',
            transition: 'width 0.3s',
          }}
        />
        <div
          style={{
            flex: 1,
            background: '#d97706',
            transition: 'width 0.3s',
          }}
        />
      </div>
    </Tooltip>
  );
};

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
      const executeCost = workunitArray.reduce((sum, wu) => sum + (wu.executeCost || 0), 0);
      const fileAccessCost = workunitArray.reduce((sum, wu) => sum + (wu.fileAccessCost || 0), 0);
      const compileCost = workunitArray.reduce((sum, wu) => sum + (wu.compileCost || 0), 0);

      return {
        key: groupName,
        groupName: groupName || 'Unnamed',
        count: workunitArray.length,
        totalCost,
        executeCost,
        fileAccessCost,
        compileCost,
        workunits: workunitArray.sort(
          (a, b) => new Date(b.workUnitTimestamp).getTime() - new Date(a.workUnitTimestamp).getTime()
        ),
      };
    });

    // Sort by total cost descending
    return groups.sort((a, b) => b.totalCost - a.totalCost);
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
      width: 120,
      render: (cost: number) => <span style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(cost)}</span>,
    },
    {
      title: 'Cost Breakdown',
      key: 'costBreakdown',
      width: 200,
      render: (_: any, record: JobGroup) => (
        <CostBreakdownBar
          compute={record.executeCost}
          fileAccess={record.fileAccessCost}
          compile={record.compileCost}
        />
      ),
    },
  ];

  // Nested table columns (child rows - individual workunits)
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
      width: 140,
      ellipsis: true,
      render: (text: string) => <span style={{ fontSize: 12 }}>{text}</span>,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 80,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: 'Cost Breakdown',
      key: 'costBreakdown',
      width: 200,
      render: (_: any, record: ExpensiveWorkunit) => (
        <CostBreakdownBar
          compute={record.executeCost}
          fileAccess={record.fileAccessCost}
          compile={record.compileCost}
        />
      ),
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
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Top Costly Jobs</span>
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
      }
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
