import { useState, useMemo } from 'react';
import { Card, Table, Space, Tag, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { formatCurrency } from '@tombolo/shared';
import { groupWorkunitsByName } from '@/components/admin/workunits/history/common/fuzzyMatch';
import type { ExpensiveWorkunit } from '@/services/workunitDashboard.service';
import styles from './TopCostlyJobs.module.css';

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
  const compilePct = (compile / total) * 100;

  return (
    <Tooltip
      title={
        <div>
          <div>Compute: {formatCurrency(compute)}</div>
          <div>File Access: {formatCurrency(fileAccess)}</div>
          <div>Compile: {formatCurrency(compile)}</div>
        </div>
      }>
      <div className={styles.costBreakdownBar}>
        <div className={styles.costSegmentCompute} style={{ width: `${cPct}%` }} />
        <div className={styles.costSegmentFileAccess} style={{ width: `${fPct}%` }} />
        {compile > 0 && <div className={styles.costSegmentCompile} style={{ width: `${compilePct}%` }} />}
      </div>
    </Tooltip>
  );
};

export default function TopCostlyJobs({ workunits }: TopCostlyJobsProps) {
  const history = useHistory();
  const [visibleCount, setVisibleCount] = useState(5);

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

  const displayedGroups = jobGroups.slice(0, visibleCount);

  const handleViewMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const handleShowLess = () => {
    setVisibleCount(5);
  };

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
          <span className={styles.jobNameGroup}>{text}</span>
          <Tag color="blue">{record.count}</Tag>
        </Space>
      ),
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      render: (cost: number) => <span className={styles.totalCost}>{formatCurrency(cost)}</span>,
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
          className={styles.jobNameButton}
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
      render: (text: string) => <span className={styles.wuIdText}>{text}</span>,
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
          <span>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              disabled={!record.detailsFetchedAt}
              onClick={() => handleView(record)}
              style={{
                color: record.detailsFetchedAt ? '#2563eb' : '#9ca3af',
                padding: 0,
              }}>
              View
            </Button>
          </span>
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
        <div className={styles.cardTitle}>
          <span className={styles.titleText}>Top Costly Jobs</span>
          <div className={styles.legend}>
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
      }
      className={styles.card}
      styles={{ body: { padding: '16px 20px' } }}>
      <Table
        columns={groupColumns}
        dataSource={displayedGroups}
        pagination={false}
        scroll={{ y: 400 }}
        size="small"
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record: JobGroup) => (
            <Table
              columns={nestedColumns}
              dataSource={record.workunits}
              pagination={false}
              size="small"
              rowKey="wuId"
              className={styles.nestedTable}
            />
          ),
          rowExpandable: () => true,
        }}
      />
      {jobGroups.length > 5 && (
        <div className={styles.viewMoreContainer}>
          {visibleCount > 5 && (
            <Button type="link" onClick={handleShowLess}>
              Show Less
            </Button>
          )}
          {visibleCount < jobGroups.length && (
            <Button type="link" onClick={handleViewMore}>
              View More (+5)
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
