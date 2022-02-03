import React from 'react';
import { Toolbar } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/menu/style/index.css';
import '@antv/x6-react-components/es/toolbar/style/index.css';

import { EyeInvisibleOutlined } from '@ant-design/icons';
import HiddenNodesList from './HiddenNodesList';

const Item = Toolbar.Item; // eslint-disable-line
const Group = Toolbar.Group; // eslint-disable-line

const CustomToolbar = ({ graphRef }) => {
  const [refresh, setRefresh] = React.useState(false);

  if (!graphRef.current) return null;

  return (
    <div style={{ marginLeft: '105px' }}>
      <Toolbar
        hoverEffect={true}
        // extra={<span>Extra Component</span>}
      >
        <Group>
          <Item
            name="hiddenNodes"
            tooltip="Hidden Nodes"
            icon={<EyeInvisibleOutlined />}
            dropdownProps={{
              visible: refresh,
              onVisibleChange: (visible) => {
                setRefresh(() => visible);
              },
            }}
            dropdown={<HiddenNodesList graphRef={graphRef} refresh={refresh} setRefresh={setRefresh} />}
          >
            Hidden Nodes
          </Item>
        </Group>
      </Toolbar>
    </div>
  );
};

export default CustomToolbar;
