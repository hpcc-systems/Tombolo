import React from 'react';
import { Card } from 'antd';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logo from '../../../images/logo-dark.webp';

import './home.css';

const Home = () => {
  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
  } = useSelector((state) => state);

  return (
    <content className="container">
      <div className="top">
        <div className="header">
          <h1 style={{ width: '100%', marginTop: '1rem' }}>Welcome to Tombolo!</h1>
          <h2>Easy Interaction with HPCC Systems Clusters</h2>
        </div>

        <div className="middle">
          <Card>
            <h2>Workflows</h2>
            <br />
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
          <Card>
            <h2>Monitoring</h2>
            <br />
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

          <Card>
            <h2>Dashboards</h2>
            <br />
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
      <div className="footer">
        <div className="footerRow">
          <div className="sub">
            <h2>Powered by HPCC Systems</h2>
            <p>Tombolo is built on top of HPCC Systems, a powerful open-source platform for big data analysis.</p>
          </div>
          <div className="sub">
            <h2>Focus on What Matters</h2>
            <p>
              Tombolo lets you focus on your data and your analysis, without worrying about the underlying
              infrastructure.
            </p>
          </div>
          <div className="sub">
            <h2>Easy to Use</h2>
            <p>
              Tombolo is designed to be easy to use, with a simple UI and great{' '}
              <a href="https://hpcc-systems.github.io/Tombolo/">documentation</a> to allow even non-technical users
              access to big data tools and analysis.
            </p>
          </div>
        </div>
        <div className="footerRow">
          <img src={logo} alt="HPCC Systems" style={{ width: '10rem', margin: '0 auto' }} />
        </div>
        <div className="footerRow">
          <p>
            Tombolo is an open source project maintained by{' '}
            <a href="https://solutionslab.hpccsystems.com/">HPCC Systems</a>.
          </p>
        </div>
      </div>
    </content>
  );
};

export default Home;
