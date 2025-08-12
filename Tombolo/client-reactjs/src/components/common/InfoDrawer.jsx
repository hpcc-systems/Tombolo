import React from 'react';
import { Drawer } from 'antd';
import ApiKeyGuide from '../userGuides/ApiKeyGuide';
import ExampleGuide from '../userGuides/ExampleGuide';
import CollaboratorGuide from '../userGuides/CollaboratorGuide';
import DataFlowGUide from '../userGuides/DataFlowGUide';
import AssetsGuide from '../userGuides/AssetsGuide';
import GithubGuide from '../userGuides/GithubGuide';
import CronGuide from '../userGuides/CronGuide';
import TeamsWebhookGuide from '../userGuides/TeamsWebhookGuide';
import ApplicationsGuide from '../userGuides/ApplicationsGuide';
import ClusterGuide from '../userGuides/ClusterGuide';
import WildcardGuide from '../userGuides/WildcardGuide';
import JobMonitoringScopeTypes from '../userGuides/JobMonitoringScopeTypes';
import JobNamePattern from '../userGuides/JobNamePattern';
import LandingZoneMonitoringTypes from '../userGuides/LandingZoneMonitoringTypes';
import MaximumDepthGuide from '../userGuides/MaximumDepthGuide';
import CostMonitoringSumGuide from '../userGuides/CostMonitoringSumGuide';

const GuideDrawer = ({ content, open, onClose, width }) => {
  /* Example Usage

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  <InfoCircleOutlined onClick={() => showDrawer()} />

  <InfoDrawer open={open} onClose={onClose} content="api"></InfoDrawer>

  */

  return (
    <Drawer placement="right" open={open} onClose={onClose} width={width}>
      {(() => {
        switch (content) {
          case 'example':
            return <ExampleGuide />;
          case 'api':
            return <ApiKeyGuide />;
          case 'collaborator':
            return <CollaboratorGuide />;
          case 'dataFlow':
            return <DataFlowGUide />;
          case 'assets':
            return <AssetsGuide />;
          case 'github':
            return <GithubGuide />;
          case 'cron':
            return <CronGuide />;
          case 'webhook':
            return <TeamsWebhookGuide />;
          case 'application':
            return <ApplicationsGuide />;
          case 'cluster':
            return <ClusterGuide />;
          case 'wildcard':
            return <WildcardGuide />;
          case 'jobMonitoringScopeTypes':
            return <JobMonitoringScopeTypes />;
          case 'jobNamePattern':
            return <JobNamePattern />;
          case 'lzMonitoringTypes':
            return <LandingZoneMonitoringTypes />;
          case 'maximumDepth':
            return <MaximumDepthGuide />;
          case 'costMonitoringSum':
            return <CostMonitoringSumGuide />;
          default:
            return <h2>Guide Not Found</h2>;
        }
      })()}
    </Drawer>
  );
};

export default GuideDrawer;
