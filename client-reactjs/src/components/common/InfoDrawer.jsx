import React from 'react';
import { Drawer } from 'antd';
import ApiKeyGuide from '../userGuides/ApiKeyGuide';
import ExampleGuide from '../userGuides/ExampleGuide';
import CollaboratorGuide from '../userGuides/CollaboratorGuide';
import DataFlowGUide from '../userGuides/DataFlowGUide';
import AssetsGuide from '../userGuides/AssetsGuide';
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
          case 'example':
            return <ExampleGuide />;
          case 'api':
            return <ApiKeyGuide />;
          case 'collaborator':
            return <CollaboratorGuide />;
          case 'dataFlow':
            return <DataFlowGUide />;
          case 'assets':
            return <AssetsGuide />;
          default:
            return <h2>Guide Not Found</h2>;
        }
      })()}
    </Drawer>
  );
};

export default GuideDrawer;
