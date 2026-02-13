import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Table, Card, Tag, Button, Tooltip, Select, DatePicker, Input, Modal, message } from 'antd';
import { ReloadOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import BreadCrumbs from '@/components/common/BreadCrumbs';
import clustersService from '@/services/clusters.service';
import moment from 'moment';
import styles from './ClusterLogs.module.css';

interface ServerFilters {
  class: string[];
  audience?: string | undefined;
  startDate: string | null;
  endDate: string | null;
}

interface ClientFilters {
  search: string;
  component: string;
}

interface LogDetailsModal {
  visible: boolean;
  data: any | null;
}

function ClusterLogs(): ReactElement {
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [clusterID, setClusterID] = useState<string | null>(null);
  const [wuid, setWuid] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [clusterInfo, setClusterInfo] = useState<any | null>(null);
  const [logAccessInfo, setLogAccessInfo] = useState<any | null>(null);
  const [serverFilters, setServerFilters] = useState<ServerFilters>({
    class: [],
    audience: undefined,
    startDate: null,
    endDate: null,
  });
  const [clientFilters, setClientFilters] = useState<ClientFilters>({
    search: '',
    component: '',
  });
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [, forceUpdate] = useState(0);
  const [logDetailsModal, setLogDetailsModal] = useState<LogDetailsModal>({ visible: false, data: null });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const clusterId = searchParams.get('clusterID');
    const clusterName = searchParams.get('clusterName');
    const workunitId = searchParams.get('wuid');

    if (!clusterId) {
      history.push('/admin/clusters');
      return;
    }

    setClusterID(clusterId);
    setWuid(workunitId);
    if (clusterName) {
      setClusterInfo((prev: any) => ({ ...(prev || {}), name: decodeURIComponent(clusterName) }));
    }
    fetchLogAccessInfo(clusterId);
    fetchLogs(clusterId, {}, workunitId);
  }, [location.search, history]);

  // Update time display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchLogAccessInfo = async (clusterId: string) => {
    try {
      const result = await clustersService.getClusterLogs(clusterId, { accessInfoOnly: true });
      setLogAccessInfo(result.logAccessInfo);
    } catch (error) {
      console.error('Error fetching log access info:', error);
    }
  };

  const fetchLogs = async (
    clusterId: string,
    filterParams: Partial<ServerFilters> = {},
    workunitId: string | null = null
  ) => {
    setLoading(true);
    try {
      const params = {
        class: filterParams.class,
        audience: filterParams.audience,
        startDate: filterParams.startDate,
        endDate: filterParams.endDate,
        wuid: workunitId,
      };

      const result = await clustersService.getClusterLogs(clusterId, params);
      setLogs(result.lines || []);
      setClusterInfo((prev: any) => ({ ...(prev || {}), ...result.cluster }));
      setLastFetched(new Date());
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleRefresh = () => {
    if (clusterID) {
      fetchLogs(clusterID, serverFilters, wuid);
    }
  };

  const handleServerFilterChange = (key: keyof ServerFilters, value: any) => {
    const newFilters = { ...serverFilters, [key]: value } as ServerFilters;
    setServerFilters(newFilters);
    if (clusterID) {
      fetchLogs(clusterID, newFilters, wuid);
    }
  };

  const handleClientFilterChange = (key: keyof ClientFilters, value: any) => {
    setClientFilters(prev => ({ ...prev, [key]: value }));
  };

  // Extract filter options from logAccessInfo
  const getFilterOptions = (columnName: string) => {
    if (!logAccessInfo?.Columns?.Column) return [] as string[];
    const column = logAccessInfo.Columns.Column.find((col: any) => col.Name === columnName);
    return column?.EnumeratedValues?.Item || [];
  };

  // Get unique components from received logs for client-side filter
  const getComponentOptions = () => {
    const components = [...new Set(logs.map(log => log.components).filter(Boolean))];
    return components.map(comp => ({ label: comp, value: comp }));
  };

  // Client-side filtering of logs
  const filteredLogs = logs.filter(log => {
    const searchMatch =
      !clientFilters.search ||
      ['message', 'components', 'pod'].some(field =>
        String(log[field] || '')
          .toLowerCase()
          .includes(clientFilters.search.toLowerCase())
      );
    const componentMatch = !clientFilters.component || log.components === clientFilters.component;
    return searchMatch && componentMatch;
  });

  // Get cluster display name
  const getClusterDisplayName = () => {
    return clusterInfo?.name || 'Loading...';
  };

  // Get status display text
  const getStatusText = () => {
    if (loading && initialLoading) return 'Loading logs...';
    if (loading) return 'Refreshing logs...';
    if (!lastFetched) return 'No data';

    const minutesAgo = Math.floor((new Date().getTime() - lastFetched.getTime()) / 60000);
    if (minutesAgo < 1) return 'Logs fetched just now';
    if (minutesAgo === 1) return 'Logs fetched 1 min ago';
    return `Logs fetched ${minutesAgo} mins ago`;
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: any) => moment(text).format('MM-DD HH:mm:ss'),
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: 'Log ID',
      dataIndex: 'logid',
      key: 'logid',
      width: 100,
      render: (text: any, record: any) => (
        <span className={styles.logLink} onClick={() => setLogDetailsModal({ visible: true, data: record })}>
          {text}
        </span>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'class',
      key: 'class',
      width: 60,
      render: (text: string) => {
        const color =
          (
            {
              ERR: 'red',
              WRN: 'orange',
              INF: 'green',
              PRO: 'blue',
              DIS: 'gray',
              MET: 'purple',
              EVT: 'cyan',
            } as Record<string, string>
          )[text] || 'default';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      key: 'audience',
      width: 80,
      render: (text: any) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: 'Component',
      dataIndex: 'components',
      key: 'components',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => (
        <Tooltip title={text}>
          <Tag color="blue">{text}</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Workunit',
      dataIndex: 'workunits',
      key: 'workunits',
      width: 120,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: 'Pod',
      dataIndex: 'pod',
      key: 'pod',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any) => <Tooltip title={text}>{text}</Tooltip>,
    },
  ];

  return (
    <>
      <div className={styles.headerContainer}>
        <BreadCrumbs />
        <div className={styles.clusterInfo}>
          <div className={styles.clusterName}>{getClusterDisplayName()}</div>
          <div className={styles.statusText}>{getStatusText()}</div>
        </div>
      </div>
      <Card className={styles.cardContainer}>
        <div className={styles.filtersContainer}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Class</div>
              <Select
                mode="multiple"
                placeholder="Select class(es)"
                className={styles.filterInput}
                allowClear
                value={serverFilters.class}
                onChange={value => handleServerFilterChange('class', value)}
                options={getFilterOptions('hpcc_log_class').map((item: any) => ({ label: item, value: item }))}
              />
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Audience</div>
              <Select
                placeholder="Audience"
                className={styles.filterInput}
                allowClear
                value={serverFilters.audience}
                onChange={value => handleServerFilterChange('audience', value)}
                options={getFilterOptions('hpcc_log_audience').map((item: any) => ({ label: item, value: item }))}
              />
            </div>
            <div className={styles.filterGroupWide}>
              <div className={styles.filterLabel}>Date Range</div>
              <DatePicker.RangePicker
                className={styles.filterInput}
                format="YYYY-MM-DD"
                disabledDate={(current: any) => (current && (current as any) > moment().endOf('day')) as boolean}
                value={
                  serverFilters.startDate && serverFilters.endDate
                    ? ([moment(serverFilters.startDate), moment(serverFilters.endDate)] as any)
                    : null
                }
                onChange={dates => {
                  const newFilters = {
                    ...serverFilters,
                    startDate: dates?.[0]?.startOf('day').toISOString() || null,
                    endDate: dates?.[1]?.endOf('day').toISOString() || null,
                  };
                  setServerFilters(newFilters);
                  if (clusterID) {
                    fetchLogs(clusterID, newFilters);
                  }
                }}
              />
            </div>
            <div className={styles.filterGroupMedium}>
              <div className={styles.filterLabel}>Search</div>
              <Input
                placeholder="Search message..."
                prefix={<SearchOutlined />}
                className={styles.filterInput}
                value={clientFilters.search}
                onChange={e => handleClientFilterChange('search', e.target.value)}
              />
            </div>
            <div className={styles.filterGroupComponent}>
              <div className={styles.filterLabel}>Component</div>
              <Select
                placeholder="Component"
                className={styles.filterInput}
                allowClear
                value={clientFilters.component}
                onChange={value => handleClientFilterChange('component', value)}
                options={getComponentOptions()}
              />
            </div>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredLogs}
          loading={loading}
          rowKey={(record: any) => `${record.logid}-${record.timestamp}`}
          scroll={{ x: 1200, y: 600 }}
          size="small"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: total => `Total ${total} logs (${logs.length} fetched)`,
          }}
        />
      </Card>

      <Modal
        open={logDetailsModal.visible}
        onCancel={() => setLogDetailsModal({ visible: false, data: null })}
        width={900}
        footer={[
          <Button
            key="copy"
            type="primary"
            ghost
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(logDetailsModal.data, null, 2));
              message.success('Log details copied to clipboard!');
            }}>
            Copy
          </Button>,
          <Button key="close" onClick={() => setLogDetailsModal({ visible: false, data: null })} type="primary" ghost>
            Close
          </Button>,
        ]}>
        {logDetailsModal.data && (
          <div className={styles.modalContent}>
            <Editor
              height="350px"
              defaultLanguage="json"
              value={JSON.stringify(logDetailsModal.data, null, 2)}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme('vs-dark');
              }}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: 'off',
                folding: false,
                glyphMargin: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
                padding: { top: 16, bottom: 16 },
                selectOnLineNumbers: false,
                selectionHighlight: false,
                occurrencesHighlight: 'off',
                renderLineHighlight: 'none',
                hideCursorInOverviewRuler: true,
                domReadOnly: true,
                contextmenu: false,
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

export default ClusterLogs;
