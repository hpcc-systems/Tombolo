import React from 'react';
import { Graph } from '@antv/x6';
import { Tooltip } from 'antd';

import {
  SyncOutlined,
  BookOutlined,
  FileOutlined,
  FileAddOutlined,
  SettingOutlined,
  SisternodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  HourglassOutlined,
  LinkOutlined,
  MessageOutlined,
  MailOutlined,
  ProfileOutlined,
} from '@ant-design/icons/lib/icons';

import { Menu, Dropdown } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/menu/style/index.css';
import '@antv/x6-react-components/es/dropdown/style/index.css';

import './Shape.css';

const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
  },
  items: [
    {
      group: 'top',
    },
    {
      group: 'right',
    },
    {
      group: 'bottom',
    },
    {
      group: 'left',
    },
  ],
};

class Node extends React.Component {
  shouldComponentUpdate() {
    const { node } = this.props;
    if (node) {
      if (node.hasChanged('data')) {
        return true;
      }
    }
    return false;
  }

  // ['failed','running','completed','compiled',  ]
  status = {
    completed: <CheckCircleOutlined style={{ color: 'green' }} />,
    compiled: <CheckCircleOutlined style={{ color: 'green' }} />,
    failed: <CloseCircleOutlined style={{ color: 'red' }} />,
    running: <ReloadOutlined style={{ color: 'grey' }} />,
    waiting: null,
    submitted: null,
  };

  schedule = {
    Time: <HourglassOutlined />,
    Predecessor: <LinkOutlined />,
    Message: <MessageOutlined />,
  };

  entities = {
    Job: <SettingOutlined />,
    File: <FileOutlined />,
    SuperFile: <FileAddOutlined />,
    FileTemplate : <ProfileOutlined />,
    Index: <BookOutlined />,
    Manual: <MailOutlined />,
    'Sub-Process': <SisternodeOutlined />,
  };

  render() {
    const { node, handleContextMenu, disableContextMenu } = this.props;
    const data = node?.getData();
    let { type, title, status = '', schedule, jobType, isSuperFile, isStencil, isAssociated, fetchingFiles } = data;
    const notAssociated  = (type === "Job" || type === "File") && !isAssociated && !isStencil ? "no-asset" : ""
    
    const showTitle = (title) => {
      const limit = 14;
      if (title.length > limit) {
        const shortTitle = title.substring(0, limit) + '...';
        return shortTitle;
      }
      return title;
    };

    if (jobType === 'Manual') type = 'Manual'; // Show different icon for Manual job
    if (isSuperFile) type = 'SuperFile';// Show different icon for SuperFile

    const getMenu = () => {
      const dialogMenuItemText = isAssociated ? 'Show details' : 'Associate with asset';
      return (
        <Menu>
          <Menu.Item key="1" onClick={() => handleContextMenu('openDialog', { node })}>
            {dialogMenuItemText}
          </Menu.Item>
          {/* <Menu.Divider/> */}
        </Menu>
      );
    };

    return (
      <Dropdown overlay={getMenu()} trigger={['contextMenu']} disabled={disableContextMenu}>
        <div className={`node-outer`}>
          <Tooltip title={title} mouseEnterDelay={1.4} mouseLeaveDelay={0.1}>
            <div className={`node-icon ${type} status-${status} ${notAssociated}`}>{this.entities[type]}</div>
            {schedule?.type ? <div className="node-schedule">{this.schedule[schedule.type]}</div> : null}
            <div className="node-title">{showTitle(title)}</div>
          </Tooltip>
          {!isStencil && fetchingFiles ? <div className='node-fetching-files'><SyncOutlined spin={true}/>  </div> : null}
        </div>
      </Dropdown>
    );
  }
}

export default class Shape {
  static init({ handleContextMenu, disableContextMenu }) {
    // We need a way how to pass props to node Registration from main graph, currently you can not register node with graph instance,
    // u need to register with class instance and it will cause nodes to be registered on each mount, which will cause an error from X6 lib
    // to avoid it we will unregister node and register it again on each time component mounts;
    Graph.unregisterNode('custom-shape'); 
    Graph.registerNode('custom-shape', {
      inherit: 'react-shape',
      component: <Node handleContextMenu={handleContextMenu} disableContextMenu={disableContextMenu} />,
      width: 90,
      height: 70,
      ports,
    });
  }
}
