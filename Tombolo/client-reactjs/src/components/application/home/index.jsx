import React, { useState, useEffect } from 'react';
import { Card, Steps } from 'antd';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import logo from '../../../images/logo-dark.webp';
import styles from './home.module.css';

const { Step } = Steps;

const Home = () => {
  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);

  // State for current step
  const [currentStep, setCurrentStep] = useState(0);

  // State to handle fade-in animation for each step
  const [visibleSteps, setVisibleSteps] = useState([false, false, false]);

  // Animate steps on component load
  useEffect(() => {
    const stepsSequence = [0, 1, 2]; // indices of steps
    let index = 0;

    const interval = setInterval(() => {
      setCurrentStep(stepsSequence[index]);

      setVisibleSteps((prev) => {
        const newVisible = [...prev];
        newVisible[index] = true;
        return newVisible;
      });

      index += 1;
      if (index >= stepsSequence.length) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.header}>
          <h1>Welcome to Tombolo!</h1>
          <h2>Monitor, Receive Alerts, Visualize — Take Action and Address Issues Proactively.</h2>
        </div>

        <div className={styles.middle}>
          <Card className={styles.workflowCard}>
            <Steps direction="vertical" className={styles.customSteps} current={currentStep} onChange={setCurrentStep}>
              <Step
                title={<span className={styles.stepHeading}>Connect</span>}
                description={
                  <p
                    className={styles.stepsContents}
                    style={{ opacity: visibleSteps[0] ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                    Connect to your HPCC Systems cluster.
                  </p>
                }
              />
              <Step
                title={<span className={styles.stepHeading}>Monitor</span>}
                description={
                  <p
                    className={styles.stepsContents}
                    style={{ opacity: visibleSteps[1] ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                    Setup Monitoring in Tombolo
                  </p>
                }
              />
              <Step
                title={<span className={styles.stepHeading}>Receive Alerts</span>}
                description={
                  <p
                    className={styles.stepsContents}
                    style={{ opacity: visibleSteps[2] ? 1 : 0, transition: 'opacity 0.5s ease-in' }}>
                    Proactively address issues
                  </p>
                }
              />
            </Steps>
          </Card>

          <Card className={styles.monitoringCard}>
            <h2>Monitoring</h2>
            <p>Setup monitoring and alerts for when things go awry with your data processing jobs and files.</p>
            <ul>
              <li>
                <Link to={`/${applicationId}/fileMonitoring`}>File Monitoring</Link>
              </li>
              <li>
                <Link to={`/${applicationId}/costMonitoring`}>Cost Monitoring</Link>
              </li>
              <li>
                <Link to={`/${applicationId}/jobMonitoring`}>Job Monitoring</Link>
              </li>
              <li>
                <Link to={`/${applicationId}/clusterMonitoring`}>Cluster Monitoring</Link>
              </li>
              <li>
                <Link to={`/${applicationId}/landingZoneMonitoring`}>Landing Zone Monitoring</Link>
              </li>
            </ul>
          </Card>

          <Card className={styles.dashboardCard}>
            <h2>Dashboards</h2>
            <p>Visualize all of the notifications produced by Tombolo, and cluster usage with dashboards.</p>
            <ul>
              <li>
                <Link to={`/${applicationId}/dashboard/notifications`}>Notification Dashboards</Link>
              </li>
            </ul>
          </Card>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerRow}>
            <div className={`${styles.sub} ${styles.footerLogoContainer}`}>
              <a href="https://hpccsystems.com/" target="_blank" rel="noopener noreferrer">
                <img src={logo} alt="HPCC Systems" />
              </a>
            </div>

            <div className={styles.sub}>
              <h4>About</h4>
              <ul>
                <li>
                  <a
                    href="https://solutionslab.hpccsystems.com/solutions/tombolo/"
                    target="_blank"
                    rel="noopener noreferrer">
                    Tombolo
                  </a>
                </li>
                <li>
                  <a href="https://hpccsystems.com/" target="_blank" rel="noopener noreferrer">
                    HPCC Systems
                  </a>
                </li>
                <li>
                  <a href="https://risk.lexisnexis.com" target="_blank" rel="noopener noreferrer">
                    LexisNexis Risk Solutions
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.sub}>
              <h4>Documentation</h4>
              <ul>
                <li>
                  <a
                    href="https://hpcc-systems.github.io/Tombolo/docs/category/installation--configuration"
                    target="_blank"
                    rel="noopener noreferrer">
                    Installation & Configurations
                  </a>
                </li>
                <li>
                  <a
                    href="https://hpcc-systems.github.io/Tombolo/docs/category/user-guides"
                    target="_blank"
                    rel="noopener noreferrer">
                    User Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://hpcc-systems.github.io/Tombolo/docs/category/developer-resources"
                    target="_blank"
                    rel="noopener noreferrer">
                    Developer Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.sub}>
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="https://solutionslab.hpccsystems.com/about/" target="_blank" rel="noopener noreferrer">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/faq" target="_blank" rel="noopener noreferrer">
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/hpcc-systems/Tombolo/discussions/904"
                    target="_blank"
                    rel="noopener noreferrer">
                    Discussions
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.sub}>
              <h4>Project Resources</h4>
              <ul>
                <li>
                  <a href="https://github.com/hpcc-systems/Tombolo" target="_blank" rel="noopener noreferrer">
                    Code Base
                  </a>
                </li>
                <li>
                  <a
                    href="https://hpcc-systems.github.io/Tombolo/release-notes"
                    target="_blank"
                    rel="noopener noreferrer">
                    Release Notes
                  </a>
                </li>
                <li>
                  <a href="https://hpcc-systems.github.io/Tombolo/contribute" target="_blank" rel="noopener noreferrer">
                    Contribute to this project
                  </a>
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
