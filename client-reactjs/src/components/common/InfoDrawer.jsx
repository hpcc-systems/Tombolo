import React from 'react';
import { Drawer } from 'antd';

const InfoDrawer = ({ title, content, open, onClose, width }) => {
  return (
    <div>
      <Drawer title={title} placement="right" visible={open} onClose={onClose} width={width}>
        {content}
      </Drawer>
    </div>
  );
};

export default InfoDrawer;
