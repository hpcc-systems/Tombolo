import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Text from '../../../common/Text';
import { Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import DashboardModal from './DashboardModal';

interface ExportMenuProps {
  selectedCluster?: any;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ selectedCluster }) => {
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const [modalVisible, setModalVisible] = useState(false);
  const [dataType, setDataType] = useState('');
  const location = useLocation();

  useEffect(() => {
    const splitName = location.pathname.split('/');
    setDataType(splitName[splitName.length - 1]);
  }, [location]);

  const menuItems = [
    { key: 'API', icon: <i className="fa fa-lg fa-link"></i>, label: 'API', onClick: (e: any) => handleMenuClick(e) },
  ];

  const handleMenuClick = async (e: any) => {
    if (e.key === 'API') setModalVisible(true);
  };

  return (
    <>
      <Dropdown menu={{ items: menuItems }} disabled={false}>
        <Button type="primary" icon={<DownOutlined style={{ marginRight: '5px' }} />} disabled={false}>
          {<Text text="Export Data" />}
        </Button>
      </Dropdown>
      <DashboardModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        applicationId={applicationId}
        dataType={dataType}
      />
    </>
  );
};

export default ExportMenu;
