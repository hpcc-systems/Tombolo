import React from 'react';
import { Tabs, Card, Tag, Typography, Space, Row, Col, Statistic, Alert } from 'antd';
import {
  ClockCircleOutlined,
  BarChartOutlined,
  FieldTimeOutlined,
  TableOutlined,
  DatabaseOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import AllMetricsPanel from './panels/AllMetricsPanel';
import OverviewPanel from './panels/OverviewPanel';
import TimelinePanel from './panels/TimelinePanel';
import SqlPanel from './panels/SqlPanel';
import HistoryPanel from './panels/HistoryPanel';
import styles from '../workunitHistory.module.css';
import { getRoleNameArray } from '@/components/common/AuthUtil';

dayjs.extend(duration);

const { Title, Text } = Typography;
const { TabPane } = Tabs as any;

const formatTime = (seconds: any) =>
  seconds == null ? '-' : dayjs.duration(seconds, 'seconds').format('HH:mm:ss.SSS');

interface Props {
  wu: any;
  details: any[];
  clusterName?: string;
}

const WorkUnitView: React.FC<Props> = ({ wu, details, clusterName }) => {
  const roleArray = getRoleNameArray();
  const isAdminOrOwner = roleArray.includes('owner') || roleArray.includes('administrator');
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
              <Statistic title="Total Time" value={formatTime(wu.totalClusterTime)} prefix={<ClockCircleOutlined />} />
              <Statistic title="Total Cost" value={wu.totalCost != null ? `$${wu.totalCost.toFixed(4)}` : '-'} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="overview" size="large">
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
              <HistoryOutlined /> Previous Runs
            </span>
          }
          key="history">
          <HistoryPanel wu={wu} clusterId={wu.clusterId} clusterName={clusterName} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <TableOutlined /> All Metrics
            </span>
          }
          key="metrics">
          <AllMetricsPanel wu={wu} details={details} />
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
