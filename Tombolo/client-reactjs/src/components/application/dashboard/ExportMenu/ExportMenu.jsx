import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Text from '../../../common/Text';
import { Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { useLocation } from 'react-router-dom';
import DashboardModal from './DashboardModal';

const ExportMenu = () => {
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const [modalVisible, setModalVisible] = useState(false);
  const [dataType, setDataType] = useState('');

  const location = useLocation();

  //get path and set data type for exporting later
  useEffect(() => {
    const splitName = location.pathname.split('/');
    setDataType(splitName[splitName.length - 1]);
  });

  const menuItems = [
    {
      key: 'API',
      icon: <i className="fa fa-lg fa-link"></i>,
      label: 'API',
      onClick: (e) => {
        handleMenuClick(e);
      },
    },
  ];

  const handleMenuClick = async (e) => {
    if (e.key === 'API') {
      setModalVisible(true);
    }
  };

  return (
    <>
      <Dropdown menu={{ items: menuItems }} onClick={(e) => handleMenuClick(e)} disabled={false}>
        <Button type="primary" icon={<DownOutlined style={{ marginRight: '5px' }} />} disabled={false}>
          {<Text text="Export Data" />}
        </Button>
      </Dropdown>
      <DashboardModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        applicationId={applicationId}
        dataType={dataType}></DashboardModal>
    </>
  );
};

export default ExportMenu;
