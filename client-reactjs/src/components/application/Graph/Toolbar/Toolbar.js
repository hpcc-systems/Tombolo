import React from 'react';
import { Toolbar } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/menu/style/index.css';
import '@antv/x6-react-components/es/toolbar/style/index.css';
import { useTranslation } from 'react-i18next';

import { EyeInvisibleOutlined, SyncOutlined, LoadingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import HiddenNodesList from './HiddenNodesList';
import Legend from './Legend';

import VersionsButton from './VersionsButton';

const Item = Toolbar.Item; // eslint-disable-line
const Group = Toolbar.Group; // eslint-disable-line

const CustomToolbar = ({ graphRef, handleSync, isSyncing, readOnly }) => {
  const [refresh, setRefresh] = React.useState(false);
  const { t } = useTranslation(['common', 'dataflow']); // t for translate -> getting namespaces relevant to this file

  if (!graphRef.current) return null;

  return (
    <div style={{ marginLeft: readOnly ? '0' : '105px' }}>
      <Toolbar
        hoverEffect={true}
        // extra={<span>Extra Component</span>}
      >
        <Group>
          <Item
            name="legend"
            tooltip={t('Legend', { ns: 'dataflow' })}
            icon={<InfoCircleOutlined />}
            dropdown={<Legend />}>
            {t('Info', { ns: 'common' })}
          </Item>
        </Group>
        {readOnly ? null : (
          <>
            <Group>
              <Item
                name='hiddenNodes'
                tooltip={t('Hidden Nodes', { ns: 'dataflow' })}
                icon={<EyeInvisibleOutlined />}
                dropdownProps={{
                  visible: refresh,
                  onVisibleChange: (visible) => {
                    setRefresh(() => visible);
                  },
                }}
                dropdown={<HiddenNodesList graphRef={graphRef} refresh={refresh} setRefresh={setRefresh} />}>
                {t('Hidden Nodes',{ns: 'dataflow'})}
              </Item>
            </Group>

            <Group>
              <Item
                name="sync"
                tooltip={t('Synchronize will validate the file/job relationship and update graph accordingly', {
                  ns: 'dataflow',
                })}
                disabled={isSyncing}
                active={isSyncing}
                icon={isSyncing ? <LoadingOutlined /> : <SyncOutlined />}
                onClick={handleSync}>
                {isSyncing ? t('...synchronizing', { ns: 'dataflow' }) : t('Synchronize graph', { ns: 'dataflow' })}
              </Item>
            </Group>

            <Group>
              <VersionsButton graphRef={graphRef} />
            </Group>
          </>
        )}
      </Toolbar>
    </div>
  );
};

export default CustomToolbar;
