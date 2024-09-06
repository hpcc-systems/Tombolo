import React, { useState } from 'react';
import { DeleteOutlined, EyeOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { Dropdown } from 'antd';

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
        key: 'Group',
        label: <Text text="New Group" />,
        icon: <PlusOutlined />,
      },
    ];

    const extraItems = [
      {
        key: 'Edit-Group',
        label: <Text text="View" />,
        icon: <EyeOutlined />,
      },
      {
        key: 'Delete-Group',
        label: <Text text="Delete" />,
        icon: <DeleteOutlined />,
      },
      {
        key: 'Move-Group',
        label: <Text text="Move" />,
        icon: <FolderOutlined />,
      },
    ];

    const isRootNode = nodeData.key === '0-0';

    if (!isRootNode) {
      extraItems.map((item) => {
        items.push(item);
      });
    }
    return items;
  };

  const onClick = (props) => {
    props.domEvent.stopPropagation();
    setVisible(false);
    handleMenuClick(props, nodeData);
  };
  return (
    <li className="group-title">
      <span className="group-options">{nodeData.title}</span>
      <Dropdown
        open={visible}
        trigger={['click']}
        menu={{ items: GroupMenu(), onClick }}
        onOpenChange={onVisibleChange}>
        <i className="fa fa-bars" onClick={(e) => e.stopPropagation()} />
      </Dropdown>
    </li>
  );
};

export default TitleRenderer;
