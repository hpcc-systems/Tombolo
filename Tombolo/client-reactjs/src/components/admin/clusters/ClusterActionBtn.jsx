import React from 'react';
import { Dropdown, Menu, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';

function ClusterActionBtn({ setDisplayAddClusterModal }) {
  // Handle desire to add new cluster
  const handleDesireToAddNewCluster = () => {
    setDisplayAddClusterModal(true);
  };
  return (
    <Dropdown
      dropdownRender={() => (
        <Menu>
          <Menu.Item key="1" onClick={handleDesireToAddNewCluster}>
            Add New Cluster
          </Menu.Item>
        </Menu>
      )}>
      <Button type="primary">
        Cluster Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
}

export default ClusterActionBtn;
