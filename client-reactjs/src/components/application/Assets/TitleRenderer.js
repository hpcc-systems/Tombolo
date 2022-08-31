import React, { useState } from 'react';
import { DeleteOutlined, EyeOutlined, FilePdfOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Dropdown, Menu } from 'antd';

import { selectGroup } from '../../../redux/actions/Groups';

const TitleRenderer = ({ nodeData, handleMenuClick }) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation(['common']); // t for translate -> getting namespaces relevant to this file

  const onVisibleChange = (isVisible) => {
    if (isVisible) {
      dispatch(selectGroup({ id: nodeData.id, key: nodeData.key }));
    }
    setVisible(isVisible);
  };

  const GroupMenu = () => {
    const items = [
      {
        key: 'Edit-Group',
        name: t('View', { ns: 'common' }),
        icon: <EyeOutlined />,
      },
      {
        key: 'Delete-Group',
        name: t('Delete', { ns: 'common' }),
        icon: <DeleteOutlined />,
      },
      {
        key: 'Move-Group',
        name: t('Move', { ns: 'common' }),
        icon: <FolderOutlined />,
      },
      {
        key: 'Print-Assets',
        name: t('Print Assets', { ns: 'common' }),
        icon: <FilePdfOutlined />,
      },
    ];

    const onClick = (props) => {
      props.domEvent.stopPropagation();
      setVisible(false);
      handleMenuClick(props, nodeData);
    };

    const isRootNode = nodeData.key === '0-0';
    return (
      <Menu mode="inline" theme="dark" onClick={onClick}>
        <Menu.Item key="Group" icon={<PlusOutlined />}>
          {t('New Group', { ns: 'common' })}
        </Menu.Item>
        {!isRootNode &&
          items.map((item) => {
            return (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.name}
              </Menu.Item>
            );
          })}
      </Menu>
    );
  };

  return (
    <li className="group-title">
      <span className="group-options">{nodeData.title}</span>
      <Dropdown visible={visible} trigger={['click']} overlay={<GroupMenu />} onVisibleChange={onVisibleChange}>
        <i className="fa fa-bars" onClick={(e) => e.stopPropagation()} />
      </Dropdown>
    </li>
  );
};

export default TitleRenderer;
