import React from 'react';
import { Card } from 'antd';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
  } = useSelector((state) => state);

  return (
    <div className="home">
      <div className="homeHeader">
        <h1 style={{ width: '100%', marginTop: '1rem' }}>Welcome to Tombolo!</h1>
        <h2>Easy Interaction with HPCC Systems Clusters</h2>
      </div>

      <div className="homeSub">
        <h2>Powered by HPCC Systems</h2>
        <p>Tombolo is built on top of HPCC Systems, a powerful open-source platform for big data analysis.</p>
      </div>
      <div className="homeSub">
        <h2>Focus on What Matters</h2>
        <p>
          Tombolo lets you focus on your data and your analysis, without worrying about the underlying infrastructure.
        </p>
      </div>
      <div className="homeSub">
        <h2>Easy to Use</h2>
        <p>
          Tombolo is designed to be easy to use, with a simple UI and great{' '}
          <a href="https://hpcc-systems.github.io/Tombolo/">documentation</a> to allow even non-technical users access
          to big data tools and analysis.
        </p>
      </div>

      <div
        style={{
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}>
        <Card style={{ width: '30%' }} title="Workflows">
          <p>Get started with creating your own workflows and jobs to process data.</p>
          <br />
          <ul>
            <li>
              <Link to={`/${applicationId}/assets`}>Assets</Link>
            </li>
            <li>
              <Link to={`/${applicationId}/dataflow`}>Dataflows</Link>
            </li>
            <li>
              <Link to={`/${applicationId}/dataflowinstances`}>Job Execution</Link>
            </li>
          </ul>
        </Card>
        <Card style={{ width: '30%' }} title="Monitoring">
          <p>Set up monitoring and alerts for when things go awry with your data processing jobs and files.</p>
          <br />
          <ul>
            <li>
              <Link to={`/${applicationId}/fileMonitoring`}>File Monitoring</Link>
            </li>
            <li>
              <Link to={`/${applicationId}/clustermonitoring`}>Cluster Monitoring</Link>
            </li>
            <li>
              <Link to={`/${applicationId}/jobmonitoring`}>Job Monitoring</Link>
            </li>

            <li>
              <Link to={`/${applicationId}/superfileMonitoring`}>Superfile Monitoring</Link>
            </li>
          </ul>
        </Card>

        <Card style={{ width: '30%' }} title="Dashboards">
          <p>Visualize all of the notifications produced by Tombolo, and cluster usage with dashboards.</p>
          <br />
          <ul>
            <li>
              <Link to={`/${applicationId}/dashboard/clusterUsage`}>Cluster Usage Dashboards</Link>
            </li>
            <li>
              <Link to={`/${applicationId}/dashboard/notifications`}>Notification Dashboards</Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Home;
