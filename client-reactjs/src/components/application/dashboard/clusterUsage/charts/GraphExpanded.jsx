import React from 'react';
import { Resizable } from 're-resizable';
import { CloseOutlined, EnterOutlined } from '@ant-design/icons';
import LinePlot from './LinePlot';

import '../index.css';

const modalSize = {
  width: 900,
  height: 460,
};

function GraphExpanded({ setViewExpandedGraph, clusterUsageHistory }) {
  return (
    <div className="graphExpanded_main">
      <div className="graphExpanded_content" onClick={(e) => e.stopPropagation()}>
        <Resizable
          minHeight={460}
          minWidth={900}
          maxHeight={460}
          maxWidth={'92vw'}
          className="graphExpanded_resizableBox"
          defaultSize={{
            width: modalSize.width,
            height: modalSize.height,
          }}>
          <div className="graphExpanded_resizableBox_content">
            <div style={{ position: 'absolute', bottom: 0, right: 5 }}>
              <EnterOutlined />
            </div>
            <div
              className="graphExpanded_close"
              onClick={() => setViewExpandedGraph(false)}
              style={{ position: 'absolute', top: 10, right: 10 }}>
              <CloseOutlined />
            </div>
            <div style={{ padding: '10px', paddingTop: 40, height: `${modalSize.height}` }}>
              <LinePlot clusterUsageHistory={clusterUsageHistory} />
            </div>
          </div>
        </Resizable>
      </div>
    </div>
  );
}

export default GraphExpanded;
