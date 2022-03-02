import React from 'react';
import { Toolbar } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/menu/style/index.css';
import '@antv/x6-react-components/es/toolbar/style/index.css';

import { EyeInvisibleOutlined, SyncOutlined, LoadingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import HiddenNodesList from './HiddenNodesList';
import Legend from './Legend';

const Item = Toolbar.Item; // eslint-disable-line
const Group = Toolbar.Group; // eslint-disable-line

const CustomToolbar = ({ graphRef, handleSync, isSyncing, readOnly }) => {
  const [refresh, setRefresh] = React.useState(false);

  if (!graphRef.current) return null;

  return (
    <div style={{ marginLeft:  readOnly ? "0": '105px' }}>
      <Toolbar
        hoverEffect={true}
        // extra={<span>Extra Component</span>}
      >
        <Group>
          <Item name="legend" tooltip="Legend" icon={<InfoCircleOutlined />} dropdown={<Legend />}>
            Info
          </Item>
        </Group>
        {readOnly ? null : (
          <>
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

            <Group>
              <Item
                name="sync"
                tooltip="Synchronize will validate the file/job relationship and update graph accordingly"
                disabled={isSyncing}
                active={isSyncing}
                icon={isSyncing ? <LoadingOutlined /> : <SyncOutlined />}
                onClick={handleSync}
              >
                {isSyncing ? '...synchronizing' : 'Synchronize graph'}
              </Item>
            </Group>
          </>
        )}
      </Toolbar>
    </div>
  );
};

export default CustomToolbar;
