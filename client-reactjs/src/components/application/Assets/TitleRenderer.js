import React, { useState } from 'react';
import { DeleteOutlined, EyeOutlined, FilePdfOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { Dropdown, Menu } from 'antd';

import { selectGroup } from '../../../redux/actions/Groups';
import Text from '../../common/Text';

const TitleRenderer = ({ nodeData, handleMenuClick }) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();

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
        name: <Text text="View" />,
        icon: <EyeOutlined />,
      },
      {
        key: 'Delete-Group',
        name: <Text text="Delete" />,
        icon: <DeleteOutlined />,
      },
      {
        key: 'Move-Group',
        name: <Text text="Move" />,
        icon: <FolderOutlined />,
      },
      {
        key: 'Print-Assets',
        name: <Text text="Print Assets" />,
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
          {<Text text="New Group" />}
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
