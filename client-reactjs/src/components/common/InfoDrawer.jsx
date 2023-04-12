import React from 'react';
import { Drawer } from 'antd';
import ApiKeyGuide from '../userGuides/ApiKeyGuide';
import ExampleGuide from '../userGuides/ExampleGuide';

const GuideDrawer = ({ content, open, onClose, width }) => {
  /* Example Usage

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  <InfoCircleOutlined onClick={() => showDrawer()} />

  <InfoDrawer open={open} onClose={onClose} content="api"></InfoDrawer>

  */

  return (
    <Drawer placement="right" visible={open} onClose={onClose} width={width}>
      {(() => {
        switch (content) {
          case 'api':
            return <ApiKeyGuide />;
          case 'example':
            return <ExampleGuide />;
          default:
            return <h2>Guide Not Found</h2>;
        }
      })()}
    </Drawer>
  );
};

export default GuideDrawer;
