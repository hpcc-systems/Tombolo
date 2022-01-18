import React from 'react';
import { Graph } from '@antv/x6';
import {
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  SisternodeOutlined,
} from '@ant-design/icons/lib/icons';

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

const Icon = React.memo(({ data }) => {
  const colors = {
    Job: 'orange',
    File: 'blue',
    Index: 'green',
    SubProcess: 'red',
  };
  const icons = {
    Job: <SettingOutlined />,
    File: <FileTextOutlined />,
    Index: <BookOutlined />,
    SubProcess: <SisternodeOutlined />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          padding: '5px',
          background: colors[data.type],
          borderRadius: 5,
          border: `2px solid dark${colors[data.type]}`,
          display: 'flex', alignItems: 'center', justifyContent:"center",
          color: 'white',
          width: "30px",
          height:'30px'
        }}
      >
        {icons[data.type]}
      </div>
      <div style={{ textAlign: 'center' }}>{data.title}</div>
    </div>
  );
});

Graph.registerNode('custom-shape', {
  inherit: 'react-shape',
  width: 60,
  height: 60,
  ports,
  component(node) {
    const data = node.getData();
    return <Icon data={data} />;
  },
});
