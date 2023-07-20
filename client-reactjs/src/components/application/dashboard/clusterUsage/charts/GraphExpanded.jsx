/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import { CloseOutlined } from '@ant-design/icons';
import LinePlot from './LinePlot';

import '../index.css';
import { absolute } from '@antv/x6/lib/registry/port-layout/absolute';

function GraphExpanded({ setViewExpandedGraph, clusterUsageHistory }) {
  const [modalSize, setModalSize] = useState({ width: 900, height: 460 });

  const handleResize = (event, { size }) => {
    console.log(size);
    setModalSize(size);
  };

  return (
    <div className="graphExpanded_main">
      <div className="graphExpanded_content" onClick={(e) => e.stopPropagation()}>
        <ResizableBox
          width={modalSize.width} // Initial width
          height={modalSize.height} // Initial height
          onResize={handleResize}
          className="graphExpanded_resizableBox"
          resizeHandles={['se']}
          minConstraints={[900, 460]}
          maxConstraints={[1750, 460]}>
          <div className="graphExpanded_resizableBox_content">
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
        </ResizableBox>
      </div>
    </div>
  );
}

export default GraphExpanded;
