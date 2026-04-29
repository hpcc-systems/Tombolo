import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Table, Space, Tag, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@tombolo/shared';
import { groupWorkunitsByName } from '@/components/admin/workunits/history/common/fuzzyMatch';
import type { ExpensiveWorkunit } from '@/services/workunitDashboard.service';
import clustersService from '@/services/clusters.service';
import { handleError } from '@/components/common/handleResponse';
import WorkunitOpenOptionsModal from '@/components/admin/workunits/history/common/WorkunitOpenOptionsModal';
import { getDashboardFailedRowClass } from './workunitRowStyles';
import styles from './TopCostlyJobs.module.css';

interface TopCostlyJobsProps {
  workunits: ExpensiveWorkunit[];
}

export interface JobGroup {
  key: string;
  groupName: string;
  count: number;
  isNoJobNameSingleton: boolean;
  stateLabel: string;
  totalCost: number;
  executeCost: number;
  fileAccessCost: number;
  compileCost: number;
  workunits: ExpensiveWorkunit[];
}

const stateColors: Record<string, string> = {
  completed: 'green',
  failed: 'red',
  running: 'blue',
  blocked: 'orange',
  waiting: 'default',
  mixed: 'default',
  unknown: 'default',
};

export const formatStateLabel = (state?: string): string => {
  if (!state) return 'Unknown';
  if (state === 'mixed') return 'Mixed';
  return state.charAt(0).toUpperCase() + state.slice(1);
};

export const getGroupStateLabel = (workunits: ExpensiveWorkunit[]): string => {
  const states = workunits
    .map(wu => wu.state?.toLowerCase())
    .filter((state): state is string => Boolean(state && state.trim()));

  if (states.length === 0) {
    return 'unknown';
  }

  const uniqueStates = new Set(states);
  if (uniqueStates.size === 1) {
    return states[0];
  }

  return 'mixed';
};

const buildJobGroup = (
  groupName: string,
  workunitArray: ExpensiveWorkunit[],
  key: string,
  isNoJobNameSingleton = false
): JobGroup => {
  const totalCost = workunitArray.reduce((sum, wu) => sum + (wu.totalCost || 0), 0);
  const executeCost = workunitArray.reduce((sum, wu) => sum + (wu.executeCost || 0), 0);
  const fileAccessCost = workunitArray.reduce((sum, wu) => sum + (wu.fileAccessCost || 0), 0);
  const compileCost = workunitArray.reduce((sum, wu) => sum + (wu.compileCost || 0), 0);

  return {
    key,
    groupName,
    count: workunitArray.length,
    isNoJobNameSingleton,
    stateLabel: getGroupStateLabel(workunitArray),
    totalCost,
    executeCost,
    fileAccessCost,
    compileCost,
    workunits: [...workunitArray].sort(
      (a, b) => new Date(b.workUnitTimestamp).getTime() - new Date(a.workUnitTimestamp).getTime()
    ),
  };
};

export const buildJobGroupsForTopCostlyJobs = (workunits: ExpensiveWorkunit[]): JobGroup[] => {
  if (!workunits || workunits.length === 0) {
    return [];
  }

  const namedWorkunits = workunits.filter(wu => typeof wu.jobName === 'string' && wu.jobName.trim().length > 0);
  const unnamedWorkunits = workunits.filter(wu => typeof wu.jobName !== 'string' || wu.jobName.trim().length === 0);

  const groupedNamedWorkunits = groupWorkunitsByName(namedWorkunits, 0.8);

  const namedGroups: JobGroup[] = Object.entries(groupedNamedWorkunits).map(([groupName, wus]) => {
    const workunitArray = wus as ExpensiveWorkunit[];
    return buildJobGroup(groupName || 'Unnamed', workunitArray, groupName || 'unnamed-group');
  });

  const unnamedGroups: JobGroup[] = unnamedWorkunits.map((wu, index) =>
    buildJobGroup(wu.wuId || `Workunit-${index + 1}`, [wu], `unnamed-${wu.wuId || index}`, true)
  );

  return [...namedGroups, ...unnamedGroups].sort((a, b) => b.totalCost - a.totalCost);
};

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
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(5);
  const [clusters, setClusters] = useState<any[]>([]);
  const suppressNextRowClick = useRef(false);

  useEffect(() => {
    clustersService
      .getAll()
      .then((data: any[]) => setClusters(data || []))
      .catch(() => {});
  }, []);

  const getClusterById = (clusterId?: string) => clusters.find((c: any) => c.id === clusterId);

  const buildEclWatchUrl = (record: ExpensiveWorkunit): string | null => {
    const cluster = getClusterById(record?.clusterId);
    const thorHost = typeof cluster?.thor_host === 'string' ? cluster.thor_host.trim() : '';
    const thorPort = typeof cluster?.thor_port === 'string' ? cluster.thor_port.trim() : '';
    const wuId = typeof record?.wuId === 'string' ? record.wuId.trim() : '';
    if (!thorHost || !thorPort || !wuId) return null;
    return `${thorHost}:${thorPort}/esp/files/index.html#/workunits/${encodeURIComponent(wuId)}`;
  };

  const handleOpenInEclWatch = (record: ExpensiveWorkunit) => {
    const url = buildEclWatchUrl(record);
    if (!url) {
      handleError('Cluster thor host/port not available for this workunit');
      return;
    }
    suppressNextRowClick.current = true;
    setTimeout(() => {
      suppressNextRowClick.current = false;
    }, 300);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Group workunits using fuzzy matching and aggregate costs
  const jobGroups = useMemo(() => {
    return buildJobGroupsForTopCostlyJobs(workunits);
  }, [workunits]);

  const displayedGroups = jobGroups.slice(0, visibleCount);

  const handleViewMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const handleShowLess = () => {
    setVisibleCount(5);
  };

  const handleView = (record: ExpensiveWorkunit) => {
    navigate(`/workunits/history/${record.clusterId}/${record.wuId}`);
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
          {record.isNoJobNameSingleton && <Tag>No Job Name</Tag>}
          <Tag color="blue">{record.count}</Tag>
        </Space>
      ),
    },
    {
      title: 'State',
      dataIndex: 'stateLabel',
      key: 'stateLabel',
      width: 110,
      render: (stateLabel: string) => (
        <Tag color={stateColors[stateLabel] || 'default'}>{formatStateLabel(stateLabel)}</Tag>
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
      render: (text: string, record: ExpensiveWorkunit) => (
        <WorkunitOpenOptionsModal
          wuId={record.wuId}
          hasEclWatchLink={Boolean(buildEclWatchUrl(record))}
          onOpenTombolo={() => handleView(record)}
          onOpenEclWatch={() => handleOpenInEclWatch(record)}>
          <Button type="link" size="small" className={styles.wuIdText}>
            {text}
          </Button>
        </WorkunitOpenOptionsModal>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 100,
      render: (state: string) => <Tag color={stateColors[state] || 'default'}>{formatStateLabel(state)}</Tag>,
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
              rowClassName={nestedRecord => getDashboardFailedRowClass(nestedRecord.state)}
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
