import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin, Button, message, Alert, Space } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import workunitsService from '@/services/workunits.service';
import WorkUnitView from './WorkUnitView';
import styles from '../workunitHistory.module.css';

const WorkUnitDetails: React.FC = () => {
  const { clusterId, wuid } = useParams<any>();
  const history = useHistory();
  const clusters = useSelector((state: any) => state.application.clusters);

  const clusterName = useMemo(() => {
    if (!clusters || !clusterId) return clusterId;
    const cluster = clusters.find((c: any) => c.id === clusterId);
    return cluster ? cluster.name : clusterId;
  }, [clusters, clusterId]);

  const [loading, setLoading] = useState<boolean>(true);
  const [wu, setWu] = useState<any>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const wuData = await workunitsService.getById(clusterId, wuid);
      setWu(wuData);

      try {
        const detailsData = await workunitsService.getDetails(clusterId, wuid);

        const flattenDetails = (graphs: any[]) => {
          const result: any[] = [];
          const traverse = (node: any, parentId: any = null, level = 0) => {
            const normalized = {
              ...node,
              _parentId: parentId,
              _level: level,
            };
            result.push(normalized);
            if (node.children && node.children.length > 0) {
              node.children.forEach((child: any) => traverse(child, node.id ?? node.scopeId ?? null, level + 1));
            }
          };
          graphs.forEach(g => traverse(g));
          return result;
        };

        const flattenedDetails = flattenDetails(detailsData.graphs || []);
        setDetails(flattenedDetails);
      } catch (error) {
        console.error('Error fetching workunit details (expected for 404):', error);
        setDetails([]);
      }
    } catch (err: any) {
      console.error('Error fetching workunit details:', err);
      setError(err.message || 'Failed to load workunit details');
      message.error('Failed to load workunit details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wuid) {
      fetchData();
    }
  }, [wuid]);

  if (loading) {
    return (
      <div className={styles.centerScreen}>
        <Spin size="large" tip="Loading workunit details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.containerNarrow}>
        <Alert
          message="Error Loading Workunit"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button size="small" onClick={fetchData} icon={<ReloadOutlined />}>
                Retry
              </Button>
              <Button size="small" onClick={() => history.push('/workunits/history')}>
                Back to List
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!wu) {
    return (
      <div className={styles.containerNarrow}>
        <Alert
          message="Workunit Not Found"
          description={`No workunit found with ID: ${wuid}`}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => history.push('/workunits/history')}>
              Back to List
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.headerBar}>
        <Space wrap size="small">
          <Button
            size="small"
            className={styles.compactBtn}
            icon={<ArrowLeftOutlined />}
            onClick={() => history.push('/workunits/history')}>
            Back to Workunit History
          </Button>
          <Button size="small" className={styles.compactBtn} icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </Space>
      </div>

      <div className={styles.contentPadding}>
        <WorkUnitView wu={wu} details={details} clusterName={clusterName} />
      </div>
    </div>
  );
};

export default WorkUnitDetails;
