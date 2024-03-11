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
  SoundOutlined,
  ProfileOutlined,
  FileSearchOutlined,
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
    console.log(this.props);
    if (node) {
      // Graph does not detect changes in nodes data when toggle collapse, need to mention it here manually
      if (node.hasChanged('data') || node.data?.isCollapsed) {
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
    Predecessor: <LinkOutlined />, // Template & Predecessor has same icons but behaves different with scheduling
    Template: <LinkOutlined />,
    Message: <MessageOutlined />,
  };

  entities = {
    Job: <SettingOutlined />,
    File: <FileOutlined />,
    SuperFile: <FileAddOutlined />,
    FileTemplate: <ProfileOutlined />,
    Monitor: <FileSearchOutlined />,
    Index: <BookOutlined />,
    Manual: <MailOutlined />,
    'Query-Publish': <SoundOutlined />,
    'Sub-Process': <SisternodeOutlined />,
  };

  render() {
    const { node, _graph, handleContextMenu, disableContextMenu } = this.props;

    const data = node?.getData();
    console.log(data);
    let {
      type,
      title,
      status = '',
      schedule,
      jobType,
      isSuperFile,
      isStencil,
      isCollapsed,
      isAssociated,
      isMonitoring,
      fetchingFiles,
    } = data;
    const notAssociated =
      (type === 'Job' || type === 'File' || type === 'FileTemplate') && !isAssociated && !isStencil ? 'no-asset' : '';

    const showTitle = (title) => {
      const limit = 14;
      if (title.length > limit) {
        const shortTitle = title.substring(0, limit) + '...';
        return shortTitle;
      }
      return title;
    };

    if (jobType === 'Manual') type = 'Manual'; // Show different icon for Manual job
    if (jobType === 'Query Publish') type = 'Query-Publish'; // Show different icon for Query Publish jobs

    if (isSuperFile) type = 'SuperFile'; // Show different icon for SuperFile
    if (isMonitoring) type = 'Monitor'; // used for fileTemplateMonitoring, shows different icon and background

    const getMenu = (nodeType) => {
      const dialogMenuItemText = isAssociated ? 'Show details' : 'Associate with asset';

      let menuItems = [];

      if (nodeType === 'Sub-Process') {
        menuItems = [
          {
            key: '1',
            label: (
              <a onClick={() => handleContextMenu('toggleSubProcess', { node })}>
                {isCollapsed ? 'Expand Sub-Process' : 'Collapse Sub-Process'}
              </a>
            ),
          },
        ];
      } else {
        menuItems = [
          {
            key: '1',
            label: <a onClick={() => handleContextMenu('openDialog', { node })}>{dialogMenuItemText}</a>,
          },
        ];
      }
      return (
        <Menu items={menuItems}>
          {/* {nodeType === 'Sub-Process' ? (
            <Menu.Item key="1" onClick={() => handleContextMenu('toggleSubProcess', { node })}>
              {isCollapsed ? 'Expand Sub-Process' : 'Collapse Sub-Process'}
            </Menu.Item>
          ) : (
            <Menu.Item key="1" onClick={() => handleContextMenu('openDialog', { node })}>
              {dialogMenuItemText}
            </Menu.Item>
          )} */}
          {/* <Menu.Divider/> */}
        </Menu>
      );
    };

    const getSubProcessNode = () => {
      console.log('test sub process');
      return (
        <div className="node-outer node-expand">
          <div className="node-title">{showTitle(title)} </div>
          {/* <MinusCircleOutlined onClick={(e) =>{ e.preventDefault(); handleContextMenu('toggleSubProcess', { node }) }} /> */}
        </div>
      );
    };

    const getNode = () => {
      console.log('test');
      if (!isStencil && type === 'Sub-Process' && !isCollapsed) return getSubProcessNode();

      return (
        <div className={'node-outer'}>
          <p>testerwqer</p>
          <Tooltip title={title} mouseEnterDelay={1.4} mouseLeaveDelay={0.1}>
            <div className={`node-icon ${type} status-${status} ${notAssociated}`}>{this.entities[type]}</div>
            {schedule?.type ? <div className="node-schedule">{this.schedule[schedule.type]}</div> : null}
            {/* {type === "Sub-Process" && <PlusCircleOutlined className='subprocess-collapse' onClick={() => handleContextMenu('toggleSubProcess', { node }) }/> } */}
            <div className="node-title">{showTitle(title)}</div>
          </Tooltip>
          {!isStencil && fetchingFiles ? (
            <div className="node-fetching-files">
              <SyncOutlined spin={true} />
            </div>
          ) : null}
        </div>
      );
    };

    return (
      <Dropdown
        overlay={getMenu(type)}
        trigger={['contextMenu']}
        disabled={disableContextMenu && !type === 'Sub-Process'}>
        {getNode()}
      </Dropdown>
    );
  }
}

export default class Shape {
  static init({ handleContextMenu, disableContextMenu, graph }) {
    // We need a way how to pass props to node Registration from main graph, currently you can not register node with graph instance,
    // u need to register with class instance and it will cause nodes to be registered on each mount, which will cause an error from X6 lib
    // to avoid it we will unregister node and register it again on each time component mounts;

    console.log(<Node handleContextMenu={handleContextMenu} disableContextMenu={disableContextMenu} graph={graph} />);
    Graph.unregisterNode('custom-shape');
    Graph.registerNode('custom-shape', {
      inherit: 'react-shape',
      component: (
        <>
          <span>testerqwerqwer</span>
        </>
      ),
      attrs: {
        body: {
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: 'rgba(95,149,255,0.05)',
          refWidth: 1,
          refHeight: 1,
        },
        image: {
          'xlink:href': 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png',
          width: 16,
          height: 16,
          x: 12,
          y: 12,
        },
        title: {
          text: 'Node',
          refX: 40,
          refY: 14,
          fill: 'rgba(0,0,0,0.85)',
          fontSize: 12,
          'text-anchor': 'start',
        },
        text: {
          text: 'this is content text',
          refX: 40,
          refY: 38,
          fontSize: 12,
          fill: 'rgba(0,0,0,0.6)',
          'text-anchor': 'start',
        },
      },
      markup: [
        {
          tagName: 'rect',
          selector: 'body',
        },
        {
          tagName: 'image',
          selector: 'image',
        },
        {
          tagName: 'text',
          selector: 'title',
        },
        {
          tagName: 'text',
          selector: 'text',
        },
      ],
      width: 90,
      height: 70,
      ports,
    });
  }
}
