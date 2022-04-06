import React, { useState } from 'react';
import { DeleteOutlined, EyeOutlined, FilePdfOutlined, FolderOutlined, PlusOutlined, } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import { selectGroup } from '../../../redux/actions/Groups';
import { useDispatch } from 'react-redux';

const TitleRenderer = ({ nodeData, handleMenuClick }) => {

  const [visible, setVisible] = useState(false)
  const dispatch =  useDispatch();

  const onVisibleChange =(isVisible) =>{
    if (isVisible){
      dispatch(selectGroup({ id: nodeData.id, key: nodeData.key}))
    
    }
    setVisible(isVisible)
  }

  const GroupMenu = () => {
    const items = [
      {
        key: 'Edit-Group',
        name: 'View',
        icon: <EyeOutlined style={{ verticalAlign: 0 }} />,
      },
      {
        key: 'Delete-Group',
        name: 'Delete',
        icon: <DeleteOutlined style={{ verticalAlign: 0 }} />,
      },
      {
        key: 'Move-Group',
        name: 'Move',
        icon: <FolderOutlined style={{ verticalAlign: 0 }} />,
      },
      {
        key: 'Print-Assets',
        name: 'Print Assets',
        icon: <FilePdfOutlined style={{ verticalAlign: 0 }} />,
      },
    ];
  
    const onClick =(props) =>{
      props.domEvent.stopPropagation()
      setVisible(false)
      handleMenuClick(props, nodeData)
    }
    
    const isRootNode = nodeData.key === '0-0';
    return (
      <Menu mode="inline" theme="dark" onClick={onClick}>
        <Menu.Item key="Group" icon={<PlusOutlined style={{ verticalAlign: 0 }} />}>
          New Group
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
      <Dropdown
        visible={visible}
        trigger={['click']}
        overlay={<GroupMenu />}
        onVisibleChange={onVisibleChange}
        >
        <i className="fa fa-bars" onClick={e => {e.stopPropagation()}} />
      </Dropdown>
    </li>
  );
}

export default TitleRenderer;
