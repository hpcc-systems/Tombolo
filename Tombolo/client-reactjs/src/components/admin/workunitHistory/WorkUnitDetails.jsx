import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Spin, Button, message, Alert, Space } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import workunitsService from '@/services/workunits.service';
import WorkUnitView from './WorkUnitView';

const WorkUnitDetails = () => {
  const { clusterId, wuid } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [wu, setWu] = useState(null);
  const [details, setDetails] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch workunit first
      const wuData = await workunitsService.getById(clusterId, wuid);
      setWu(wuData);

      // Try to fetch details, but handle 404 gracefully
      try {
        const detailsData = await workunitsService.getDetails(clusterId, wuid);

        // Flatten the hierarchical structure into a flat array
        const flattenDetails = graphs => {
          const result = [];
          const traverse = node => {
            result.push(node);
            if (node.children && node.children.length > 0) {
              node.children.forEach(traverse);
            }
          };
          graphs.forEach(traverse);
          return result;
        };

        const flattenedDetails = flattenDetails(detailsData.graphs || []);
        setDetails(flattenedDetails);
      } catch (error) {
        // If details are not found (404), just continue with empty details
        console.error('Error fetching workunit details (expected for 404):', error);
        setDetails([]);
      }
    } catch (err) {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Loading workunit details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: '50px auto' }}>
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
              <Button size="small" onClick={() => history.push('/admin/workunits')}>
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
      <div style={{ padding: 24, maxWidth: 800, margin: '50px auto' }}>
        <Alert
          message="Workunit Not Found"
          description={`No workunit found with ID: ${wuid}`}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => history.push('/admin/workunits')}>
              Back to List
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/admin/workunits')}>
          Back to Workunit History
        </Button>
      </div>
      <WorkUnitView wu={wu} details={details} />
    </div>
  );
};

export default WorkUnitDetails;
