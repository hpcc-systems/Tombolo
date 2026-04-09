import React, { useState } from 'react';
import { Tabs, Card, Tag, Typography, Space, Row, Col, Statistic, Alert } from 'antd';
import {
  ApartmentOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { formatHours, formatCurrency } from '@tombolo/shared';
import type { WorkUnit } from '@tombolo/shared';
import GraphPanel from './panels/graph/GraphPanel';
import HierarchyExplorer, { HierarchyExplorerSelectPayload } from './panels/HierarchyExplorer';
import OverviewPanel from './panels/OverviewPanel';
import TimelinePanel from './panels/TimelinePanel';
import SqlPanel from './panels/SqlPanel';
import HistoryPanel from './panels/HistoryPanel';
import styles from '../workunitHistory.module.css';
import { getRoleNameArray } from '@/components/common/AuthUtil';

dayjs.extend(duration);

const { Title, Text } = Typography;
const { TabPane } = Tabs as any;

interface Props {
  wu: WorkUnit;
  details: any[];
  clusterName?: string;
}

const WorkUnitView: React.FC<Props> = ({ wu, details, clusterName }) => {
  const roleArray = getRoleNameArray();
  const isAdminOrOwner = roleArray.includes('owner') || roleArray.includes('administrator');

  const [graphSelectedNode, setGraphSelectedNode] = useState<any>(null);
  const handleGraphExplorerSelect = ({ node }: HierarchyExplorerSelectPayload) => setGraphSelectedNode(node);
  const graphSelectedScopeName: string | null = graphSelectedNode?.scopeName ?? null;

  const [activeTab, setActiveTab] = useState<string>('overview');
  return (
    <div className={`${styles.pageContainer} ${styles.pageBgLighter}`}>
      <Card className={styles.cardMarginBottom16}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>
              {wu.jobName || wu.wuId}
              <Tag
                className={styles.ml12}
                color={wu.state === 'completed' ? 'success' : wu.state === 'failed' ? 'error' : 'processing'}>
                {wu.state.toUpperCase()}
              </Tag>
            </Title>
            <Text type="secondary">
              {wu.wuId} • {clusterName || wu.clusterId} • Submitted{' '}
              {dayjs(wu.workUnitTimestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic
                title="Total Runtime"
                value={formatHours(wu.totalClusterTime)}
                prefix={<ClockCircleOutlined />}
              />
              <Statistic title="Total Cost" value={formatCurrency(wu.totalCost)} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="overview" activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane
          tab={
            <span>
              <BarChartOutlined /> Overview
            </span>
          }
          key="overview">
          {details.length === 0 ? (
            <Card>
              <Alert
                message="No Details Available"
                description="Detailed performance metrics have not been fetched for this workunit yet."
                type="info"
                showIcon
              />
            </Card>
          ) : (
            <OverviewPanel wu={wu} details={details} clusterName={clusterName} />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <FieldTimeOutlined /> Timeline
            </span>
          }
          key="timeline">
          {details.length === 0 ? (
            <Card>
              <Alert
                message="No Details Available"
                description="Detailed performance metrics have not been fetched for this workunit yet."
                type="info"
                showIcon
              />
            </Card>
          ) : (
            <TimelinePanel wu={wu} details={details} />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <ApartmentOutlined /> Graph
            </span>
          }
          key="graph">
          {details.length === 0 ? (
            <Card>
              <Alert
                message="No Details Available"
                description="Detailed performance metrics have not been fetched for this workunit yet."
                type="info"
                showIcon
              />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={8} xl={7}>
                <HierarchyExplorer
                  details={details}
                  storageKeyPrefix="wuh.graph"
                  onSelect={handleGraphExplorerSelect}
                />
              </Col>
              <Col xs={24} lg={16} xl={17}>
                <GraphPanel
                  clusterId={wu.clusterId}
                  wuid={wu.wuId}
                  selectedScopeId={graphSelectedScopeName}
                  height="calc(100vh - 280px)"
                  active={activeTab === 'graph'}
                />
              </Col>
            </Row>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined /> Previous Runs
            </span>
          }
          key="history">
          <HistoryPanel wu={wu} clusterId={wu.clusterId} clusterName={clusterName} />
        </TabPane>

        {isAdminOrOwner && (
          <TabPane
            tab={
              <span>
                <DatabaseOutlined /> SQL
              </span>
            }
            key="sql">
            <SqlPanel clusterId={wu.clusterId} wuid={wu.wuId} clusterName={clusterName} />
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default WorkUnitView;
