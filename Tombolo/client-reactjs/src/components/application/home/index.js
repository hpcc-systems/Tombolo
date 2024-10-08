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
    <section className="container">
      <div className="innerContainer">
        <div className="header">
          <h1 style={{ width: '100%', marginTop: '1rem' }}>Welcome to Tombolo!</h1>
          <h2>Transform and Process Data with Ease: Your Low-Code Bridge to HPCC Systems.</h2>
        </div>

        <div className="middle">
          <Card>
            <h2>Workflows</h2>

            <p>Get started with creating your own workflows and jobs to process data.</p>

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

            <p>Set up monitoring and alerts for when things go awry with your data processing jobs and files.</p>

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

            <p>Visualize all of the notifications produced by Tombolo, and cluster usage with dashboards.</p>

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
        <div className="footer">
          {/* could not make this look good, so commented out, could probably add into the main area but it is on our docs so seems redundant */}
          {/* <div className="footerRow">
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
        </div> */}

          <div className="footerRow" style={{ marginBottom: '1rem' }}>
            <div className="sub" style={{ display: 'flex', alignItems: 'center' }}>
              <a style={{ margin: '0 auto' }} href="https://solutionslab.hpccsystems.com/">
                <img src={logo} alt="HPCC Systems" style={{ width: '10rem', margin: '0 auto' }} />
              </a>
            </div>

            <div className="sub">
              <h4>About</h4>
              <ul>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo">Tombolo</a>
                </li>
                <li>
                  <a href="https://hpccsystems.com/">HPCC Systems</a>
                </li>
                <li>
                  <a href="https://risk.lexisnexis.com">LexisNexis Risk Solutions</a>
                </li>
              </ul>
            </div>
            <div className="sub">
              <h4>Documentation</h4>
              <ul>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/docs/category/installation--configuration">
                    Installation & Configurations
                  </a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/docs/category/user-guides">User Documentation</a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/docs/category/developer-resources">
                    Developer Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div className="sub">
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="https://solutionslab.hpccsystems.com/about/">Contact</a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/faq">FAQ</a>
                </li>
                <li>
                  <a href="https://github.com/hpcc-systems/Tombolo/discussions/904">Discussions</a>
                </li>
              </ul>
            </div>
            <div className="sub">
              <h4>Project Resources</h4>
              <ul>
                <li>
                  <a href="https://github.com/hpcc-systems/Tombolo">Code Base</a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/release-notes">Release Notes</a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/contribute">Contribute to this project</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
