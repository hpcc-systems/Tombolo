import React from 'react';
import { Dropdown, Menu, Button, Tour } from 'antd';
import { DownOutlined } from '@ant-design/icons';

function ClusterActionBtn({ setDisplayAddClusterModal, tourOpen, setTourOpen, addClusterButtonRef }) {
  // Handle desire to add new cluster
  const handleDesireToAddNewCluster = () => {
    setDisplayAddClusterModal(true);
    setTourOpen(false);
  };

  //Tour steps
  const steps = [
    {
      title: 'Add Cluster',
      description:
        'Click here to add a Cluster from the whitelist file. Once you add a Cluster you will unlock the rest of the application and be on your way to managing and monitoring your data. ',
      placement: 'bottom',
      arrow: true,
      target: () => addClusterButtonRef.current,
      nextButtonProps: { style: { display: 'none' }, disabled: true },
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
          onMouseOver={() => {
            //add mouseOver handler to close tour if it is open, otherwise tour will fly to the middle of the screen on mouseover
            if (tourOpen) {
              setTourOpen(false);
            }
          }}>
          Cluster Actions <DownOutlined />
        </Button>
      </Dropdown>
    </>
  );
}

export default ClusterActionBtn;
