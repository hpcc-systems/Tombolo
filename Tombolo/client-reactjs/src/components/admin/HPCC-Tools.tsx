import React from 'react';

const HPCC_Tools: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <iframe
          src="/api/hpcc-tools-docs/"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="HPCC Tools Documentation"
        />
      </div>
    </div>
  );
};

export default HPCC_Tools;
