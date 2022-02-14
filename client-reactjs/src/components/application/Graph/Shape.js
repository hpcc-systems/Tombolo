import React from 'react';
import { Graph } from '@antv/x6';
import {
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  SisternodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  HourglassOutlined,
  LinkOutlined,
  MessageOutlined,
  MailOutlined
} from '@ant-design/icons/lib/icons';

import './Shape.css'

const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 3,
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
          r: 3,
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
          r: 3,
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
          r: 3,
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
    const { node } = this.props
    if (node) {
      if (node.hasChanged('data')) {
        return true
      }
    }
    return false
  }

  // ['failed','running','completed','compiled',  ]
  status ={
    completed : <CheckCircleOutlined style={{color:'green'}} />,
    compiled: <CheckCircleOutlined style={{color:'green'}} />,
    failed: <CloseCircleOutlined style={{color:'red'}} />,
    running: <ReloadOutlined  style={{color:'grey'}} />,
    waiting: null,
    submitted: null
  }

  schedule ={ 
    Time: <HourglassOutlined />,
    Predecessor: <LinkOutlined />,
    Message : <MessageOutlined />
  }

 entities = {
    Job: <SettingOutlined />,
    File: <FileTextOutlined />,
    Index: <BookOutlined />,
    Manual : <MailOutlined />,
    'Sub-Process': <SisternodeOutlined />,
  };

  render() {
    const { node } = this.props
    const data = node?.getData()
    let { type, title, status, scheduleType, jobType, isStencil } = data

    if (isStencil){
      return ( 
       <div className={`${type} stencil-node`}>
          {title}
        </div>
      )
    }

    if (jobType === 'Manual') type = "Manual" // Show different icon for Manual job
    
    return (
     <div className={`node ${type} ${status}`}>
      {this.entities[type]}
      <span className="label">{title}</span>
      <span className="status">
        {this.schedule[scheduleType]}
        {this.status[status]}
      </span>
    </div>
    )
  }
}

Graph.registerNode('custom-shape', {
  inherit: 'react-shape',
  component : <Node />,
  width: 180,
  height: 40,
  ports,
});
