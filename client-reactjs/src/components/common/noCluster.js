import React from 'react';
import { Modal } from 'antd';
import { Link } from 'react-router-dom';

const NoCluster = ({ visible, setVisible, applicationId }) => {
  const handleOk = () => {
    setVisible(false);
  };

  return (
    <div>
      <Modal title="No Clusters Setup" open={visible} onOk={handleOk}>
        <p>
          It looks like you do not have any clusters set up, most of Tombolos functionalities rely on a connection to an
          HPCC cluster including:
          <br />
          <br />
          <ul>
            <li>
              <Link to={`/${applicationId}/Dataflow`} onClick={() => setVisible(false)}>
                Workflow Management
              </Link>
            </li>
            <li>
              <Link to={`/${applicationId}/fileMonitoring`} onClick={() => setVisible(false)}>
                File Monitoring
              </Link>
            </li>
            <li>
              <Link to={`/${applicationId}/clustermonitoring`} onClick={() => setVisible(false)}>
                Cluster Monitoring
              </Link>
            </li>
            <li>
              <Link to={`/${applicationId}/jobmonitoring`} onClick={() => setVisible(false)}>
                Job Monitoring
              </Link>
            </li>

            <li>
              <Link to={`/${applicationId}/superfileMonitoring`} onClick={() => setVisible(false)}>
                Superfile Monitoring
              </Link>
            </li>

            <li>
              <Link to={`/${applicationId}/dashboard/clusterUsage`} onClick={() => setVisible(false)}>
                Cluster Usage Dashboards
              </Link>
            </li>
            <li>
              <Link to={`/${applicationId}/dashboard/notifications`} onClick={() => setVisible(false)}>
                Notification Dashboards
              </Link>
            </li>
          </ul>
          <br />
          <Link to="/admin/clusters" onClick={() => setVisible(false)}>
            Set up a cluster now
          </Link>
          , or go to the left navigation and select the cluster option at any time.
        </p>
      </Modal>
    </div>
  );
};

export default NoCluster;
