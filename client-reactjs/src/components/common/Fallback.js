import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';

const Fallback = () => {
  const DELAY = 500; // 500ms
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    //  Suspense uses this element as a Fallback, it flashes everytime it looks for a new chunk,
    // we will delay showing spinner for 500ms, to avoid flashes on fast internet
    const timer = setTimeout(() => setVisible(true), DELAY);
    return () => clearTimeout(timer);
  });

  return !visible ? null : (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" tip="Tombolo" />
    </div>
  );
};

export default Fallback;
