import React from 'react';
import { Dropdown, Menu, Button, Tour } from 'antd';
import { DownOutlined } from '@ant-design/icons';

interface ClusterActionBtnProps {
  setDisplayAddClusterModal: (v: boolean) => void;
  tourOpen: boolean;
  setTourOpen: (v: boolean) => void;
  addClusterButtonRef: React.RefObject<HTMLButtonElement>;
}

const ClusterActionBtn: React.FC<ClusterActionBtnProps> = ({
  setDisplayAddClusterModal,
  tourOpen,
  setTourOpen,
  addClusterButtonRef,
}) => {
  const handleDesireToAddNewCluster = () => {
    setDisplayAddClusterModal(true);
    setTourOpen(false);
  };

  const steps: any[] = [
    {
      title: 'Add Cluster',
      description:
        'Click here to add a Cluster from the whitelist file. Once you add a Cluster you will unlock the rest of the application and be on your way to managing and monitoring your data. ',
      placement: 'bottom',
      arrow: true,
      target: () => addClusterButtonRef.current,
      nextButtonProps: { style: { display: 'none' } },
    },
  ];
  return (
    <>
      <Tour open={tourOpen} steps={steps} onClose={() => setTourOpen(false)}></Tour>

      <Dropdown
        dropdownRender={() => (
          <Menu>
            <Menu.Item key="1" onClick={handleDesireToAddNewCluster}>
              Add New Cluster
            </Menu.Item>
          </Menu>
        )}>
        <Button
          type="primary"
          ref={addClusterButtonRef}
          onClick={() => {
            if (tourOpen) {
              setTourOpen(false);
            }
          }}>
          Cluster Actions <DownOutlined />
        </Button>
      </Dropdown>
    </>
  );
};

export default ClusterActionBtn;
