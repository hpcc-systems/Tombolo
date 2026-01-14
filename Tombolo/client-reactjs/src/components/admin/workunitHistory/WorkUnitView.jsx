import { Tabs, Card, Tag, Typography, Space, Row, Col, Statistic, Alert } from 'antd';
import {
  ClockCircleOutlined,
  BarChartOutlined,
  FieldTimeOutlined,
  TableOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import AllMetricsPanel from './AllMetricsPanel';
import OverviewPanel from './OverviewPanel';
import TimelinePanel from './TimelinePanel';
import SqlPanel from './SqlPanel';
import styles from './workunitHistory.module.css';
dayjs.extend(duration);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const formatTime = seconds => (seconds == null ? '-' : dayjs.duration(seconds, 'seconds').format('HH:mm:ss.SSS'));

const WorkUnitView = ({ wu, details }) => {

  return (
    <div className={`${styles.pageContainer} ${styles.pageBgLighter}`}>
      {/* Header */}
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
              {wu.wuId} • {wu.clusterId} • Submitted {dayjs(wu.workUnitTimestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <Statistic title="Total Time" value={formatTime(wu.totalClusterTime)} prefix={<ClockCircleOutlined />} />
              <Statistic title="Total Cost" value={`$${wu.totalCost.toFixed(4)}`} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="overview" size="large">
        {/* Overview */}
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
            <OverviewPanel wu={wu} details={details} />
          )}
        </TabPane>

        {/* Timeline */}
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

        {/* Full Metrics Details */}
        <TabPane
          tab={
            <span>
              <TableOutlined /> All Metrics
            </span>
          }
          key="metrics">
          <AllMetricsPanel wu={wu} details={details} />
        </TabPane>

        {/* SQL */}
        <TabPane
          tab={
            <span>
              <DatabaseOutlined /> SQL
            </span>
          }
          key="sql">
          <SqlPanel clusterId={wu.clusterId} wuid={wu.wuId} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkUnitView;
