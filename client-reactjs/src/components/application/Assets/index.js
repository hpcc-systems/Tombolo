import React, { useState, useEffect, useRef } from 'react'
import { Tree, Row, Col, Menu, Button, Modal, Form, Input, Dropdown, Checkbox, Select, message } from 'antd/lib';
import { debounce } from 'lodash';
import BreadCrumbs from "../../common/BreadCrumbs";
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from '../../common/Constants';
import { useSelector, useDispatch } from "react-redux";
import { withRouter, NavLink } from 'react-router-dom';
import { assetsActions } from '../../../redux/actions/Assets';
import { groupsActions } from '../../../redux/actions/Groups';
import AssetsTable from "./AssetsTable";
import { MarkdownEditor } from "../../common/MarkdownEditor.js"
import useOnClickOutside from '../../../hooks/useOnClickOutside';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined, FolderOutlined, DownOutlined, BarsOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import TitleRenderer from "./TitleRenderer.js"
import { flatten } from "../../common/CommonUtil.js";

const { TreeNode, DirectoryTree } = Tree;
const { SubMenu } = Menu;
const { confirm } = Modal;
const { Search } = Input;
const CheckboxGroup = Checkbox.Group;
message.config({top: 100});

function Assets(props) {
  const [application, setApplication] = useState({...props});
  const [selectedGroup, setSelectedGroup] = useState({id:'', key:''});
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({name:'', description:'', id: ''});
  const [newGroupForm, setNewGroupForm] = useState({submitted:false});
  const [treeData, setTreeData] = useState([]);
  const [openCreateGroupDialog, setOpenCreateGroupDialog] = useState(false);
  const [rightClickNodeTreeItem, setRightClickNodeTreeItem] = useState({
    visible: false,
    pageX: 0,
    pageY: 0,
    id: '',
    categoryName: ''
  });
  const [assetTypeFilter, setAssetTypeFilter] = useState(['File', 'Job', 'Query', 'Indexes']);
  const [searchKeyWord, setSearchKeyWord] = useState('');
  const [dataList, setDataList] = useState([]);
  const formItemLayout = {
    labelCol: {
      xs: { span: 2 },
      sm: { span: 10 },
    },
    wrapperCol: {
      xs: { span: 4 },
      sm: { span: 24 },
    },
  };

  const searchOptions = ['File', 'Job', 'Query', 'Indexes'];

  const [form] = Form.useForm();
  const groupsReducer = useSelector(state => state.groupsReducer);
  //ref for More Options context menu
  const ref = useRef();
  //hook for outside click to close the more options context menu
  useOnClickOutside(ref, () => setRightClickNodeTreeItem({visible: false}));

  let list = [];

  useEffect(() => {
    if(application.applicationId) {
      fetchGroups();
    }
  }, [application]);

  useEffect(() => {
    //if there is a search term and filter is changed, then trigger search
    if(searchKeyWord && searchKeyWord.length > 0) {
      handleAssetSearch(searchKeyWord);
    }
  }, [assetTypeFilter]);

  const fetchGroups = () => {
    let url = "/api/groups?app_id="+application.applicationId;
    fetch(url, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      setTreeData(data)
      let list = generateList(data);
      setDataList(list);
      //select & expand groups
      const {keys={selectedKeys:{id:'', key:'0-0'}, expandedKeys:['0-0']}} = {...groupsReducer};
      setSelectedGroup({'id':keys.selectedKeys.id, 'key':keys.selectedKeys.key})
      setExpandedGroups(keys.expandedKeys);

      setSearchKeyWord('');
      dispatch(assetsActions.searchAsset(
        '',
        ''
      ))

    }).catch(error => {
      console.log(error);
    });
  }

  const dispatch = useDispatch();

  const onSelect = (keys, event) => {
    setSelectedGroup({id:event.node.props.id, key:event.node.props.eventKey})
    dispatch(groupsActions.groupExpanded(
      {id:event.node.props.id, key:keys[0]},
      keys
    ));
  };

  const onExpand = (expandedKeys) => {
    setExpandedGroups(expandedKeys);
    dispatch(groupsActions.groupExpanded(
      selectedGroup,
      expandedKeys
    ));
  };

  const getParentKey = (key, treeData) => {
    let parentKey;
    for (let i = 0; i < treeData.length; i++) {
      const node = treeData[i];
      if (node.children) {
        if (node.children.some(item => item.key === key)) {
          parentKey = node.key;
        } else if (getParentKey(key, node.children)) {
          parentKey = getParentKey(key, node.children);
        }
      }
    }
    return parentKey;
  };

  const generateList = data => {
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      const { key, title, id } = node;
      list.push({ key, title, id });
      if (node.children) {
        generateList(node.children);
      }
    }
    return list;
  };

  const openGroup = (groupId) => {
    //setSearchKeyWord('');
    let match = dataList.filter(group => group.id == groupId);
    let parentKey = getParentKey(match[0].key, treeData);
    setSelectedGroup({id:match[0].id, key:match[0].key})
    onExpand([parentKey])
  }

  const showMoreOptions = e => {
    e.preventDefault();
    setRightClickNodeTreeItem({
      visible: true,
      pageX: e.clientX,
      pageY: e.clientY,
    });

  }

  const openNewGroupDialog = () => {
    setOpenCreateGroupDialog(true);
  }

  const onClickOutside = () => {
    setRightClickNodeTreeItem({visible: false});
    document.removeEventListener('click', onClickOutside)
  }

  const closeCreateGroupDialog = () => {
    setOpenCreateGroupDialog(false);
    form.setFieldsValue({name:'', description:'', id:''})
    setNewGroup({name:'', description:'', id:''});
    setNewGroupForm({submitted: false})
  }

  const handleMenuClick = (e) => {
    setRightClickNodeTreeItem({visible: false});
    dispatch(assetsActions.newAsset(
      application.applicationId,
      selectedGroup.id
    ));

    switch (e.key) {
      case 'File':
        props.history.push('/' + application.applicationId + '/file');
        break;

      case 'Index':
        props.history.push('/' + application.applicationId + '/index');
        break;

      case 'Query':
        props.history.push('/' + application.applicationId + '/query');
        break;

      case 'Job':
        props.history.push('/' + application.applicationId + '/job');
        break;

      case 'Group':
        openNewGroupDialog();
        break;

      case 'Edit-Group':
        handleEditGroup();
        break;

      case 'Delete-Group':
        handleDeleteGroup();
        break;
    }
  }

  const RightClickMenu = props => {
    return (rightClickNodeTreeItem.visible ?
      <React.Fragment>
      <div ref={ref} style={{left: `${rightClickNodeTreeItem.pageX + 40}px`, top: `${rightClickNodeTreeItem.pageY}px`}} className="self-right-menu">
        <Menu style={{ width: 150 }} mode="vertical" theme="dark" onClick={handleMenuClick} ref={ref}>
         <Menu.Item key="Group"><FolderOutlined /> New Group</Menu.Item>
         {(selectedGroup && selectedGroup.id != null && selectedGroup.id != '') ?
           <Menu.Item key="Edit-Group"><EditOutlined />Edit</Menu.Item> : null}
         {selectedGroup && selectedGroup.id != null && selectedGroup.id != '' ?
           <Menu.Item key="Delete-Group"><DeleteOutlined />Delete</Menu.Item> : null}
       </Menu>
      </div>
      </React.Fragment>
     : null)
  }

  const handleCreateGroup = (e) => {
    e.preventDefault();
    let isNew = (newGroup.id && newGroup.id != '') ? false : true;
    setNewGroupForm({'submitted': true});
    fetch('/api/groups', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        "isNew": isNew,
        "parentGroupId": isNew ? selectedGroup.id : '',
        "name": newGroup.name,
        "applicationId": application.applicationId,
        "description": newGroup.description,
        "id": newGroup.id
      })
    }).then(function(response) {
      if(response.ok && response.status == 200) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      if(data && data.success) {
        closeCreateGroupDialog();
        fetchGroups();
      }
    }).catch(error => {
      console.log(error);
    });

  }

  const handleDeleteGroup = () => {
    confirm({
      title: 'Are you sure you want to delete this Group?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        fetch('/api/groups', {
          method: 'delete',
          headers: authHeader(),
          body: JSON.stringify({
            "group_id": selectedGroup.id,
            "app_id": application.applicationId
          })
        }).then(function(response) {
          if(response.ok) {
            return response.json();
          }

          handleError(response);
        }).then(function(data) {
          fetchGroups();
        }).catch(error => {
          console.log(error);
        });
      },
      onCancel() {
      },
    });
  }

  const handleEditGroup = (groupIdFromAssetsView) => {
    let groupId = (groupIdFromAssetsView && groupIdFromAssetsView != '') ? groupIdFromAssetsView : selectedGroup.id;
    fetch('/api/groups/details?app_id='+application.applicationId+'&group_id='+groupId, {
      headers: authHeader(),
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      form.setFieldsValue({
        'name': data.name,
        'description': data.description
      })

      setNewGroup({
        'name': data.name,
        'description': data.description,
        'id': data.id
      })
    }).catch(error => {
      console.log(error);
    });
    setOpenCreateGroupDialog(true);
  }

  const handleDragEnter = (info) => {
  }

  const handleDragDrop = (info) => {
    if(info.node != undefined && info.dragNode != undefined) {
      confirm({
        title: 'Are you sure you want to move "'+info.dragNode.title+ '" to "'+info.node.title+ '" group?',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk() {
          const dropKey = info.node.props.eventKey;
          const dragKey = info.dragNode.props.eventKey;
          const dropPos = info.node.props.pos.split('-');
          fetch('/api/groups/move', {
            method: 'put',
            headers: authHeader(),
            body: JSON.stringify({
              "groupId": info.dragNode.id,
              "destGroupId": info.node.id,
              "app_id": application.applicationId
            })
          }).then(function(response) {
            if(response.ok) {
              return response.json();
            }

            handleError(response);
          }).then(function(data) {
            fetchGroups();
          }).catch(error => {
            console.log(error);
          });
        }
      })
    }
  }

  const handleAssetSearch = debounce ((value, enterPress) => {
    let expandedKeys = [];
    //validate only if enter pressed otherwise clearing search term will also trigger this validation
    if(enterPress && !value) {
      message.error("Please enter a valid search term")
      return;
    }

    if(assetTypeFilter.length == 0) {
      message.error("Please select atleast one asset type")
      return;
    }

    setSearchKeyWord(value);
    let assetFilter = assetTypeFilter.length != searchOptions.length ? assetTypeFilter.join(',') : ''
    dispatch(assetsActions.searchAsset(
      assetFilter,
      value
    ))
  }, 350)

  const titleRenderer = (nodeData) => {
    return <TitleRenderer title={nodeData.title} showMoreOptions={showMoreOptions} textToHighlight={searchKeyWord}/>
  }

  const onAssetTypeFilterChange = (selectedValues) => {
    setAssetTypeFilter(selectedValues);
  }

  const authReducer = useSelector(state => state.authenticationReducer);
  const editingAllowed = hasEditPermission(authReducer.user);

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="File"><i className="fa fa-lg fa-file"></i> File</Menu.Item>
      <Menu.Item key="Index"><i className="fa fa-lg fa-indent"></i> Index</Menu.Item>
      <Menu.Item key="Query"><i className="fa fa-lg fa-search"></i> Query</Menu.Item>
      <Menu.Item key="Job"><i className="fa fa-lg fa-clock-o"></i> Job</Menu.Item>
    </Menu>
  );

  const selectBefore = (
    <Select
        style={{ width: 20 }}
        suffixIcon={<SettingOutlined className="search-options-icon"/>}
        dropdownClassName="search-filter"
        dropdownRender={menu => (
          <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
            <CheckboxGroup options={searchOptions} defaultValue={assetTypeFilter} onChange={onAssetTypeFilterChange} />
          </div>
        )}
      >
      </Select>
  );

  return (
      <React.Fragment>
        <div>
          <div className="d-flex justify-content-end" style={{paddingTop:"55px", margin: "5px"}}>
            <BreadCrumbs applicationId={application.applicationId} applicationTitle={application.applicationTitle}/>
            <div className="ml-auto">
              {editingAllowed ?
                <Dropdown overlay={menu}>
                  <Button className="btn btn-secondary btn-sm" >
                    Add Asset <DownOutlined />
                  </Button>
                </Dropdown>
                : null }
            </div>
          </div>
          <Row gutter={24}>
            <Col className="gutter-row groups-div" span={4}>
              <div className="gutter-box">
                  <div style={{ marginBottom: 8 }}>
                    <Input
                      addonBefore={selectBefore}
                      placeholder="Search assets"
                      allowClear
                      onPressEnter={e => handleAssetSearch(e.target.value, true)}
                      onChange={e => handleAssetSearch(e.target.value)}/>
                  </div>
                  <DirectoryTree
                    onSelect={onSelect}
                    onExpand={onExpand}
                    treeData={treeData}
                    selectedKeys={[selectedGroup.key]}
                    expandedKeys={expandedGroups}
                    autoExpandParent={true}
                    draggable
                    onDragEnter={handleDragEnter}
                    onDrop={handleDragDrop}
                    expandAction={false}
                    titleRender={titleRenderer}
                  />
              </div>
            </Col>
            <Col className="gutter-row groups-div" span={20}>
              <div className="gutter-box">
                <AssetsTable selectedGroup={selectedGroup} handleEditGroup={handleEditGroup} refreshGroups={fetchGroups} openGroup={openGroup}/>
              </div>
            </Col>
          </Row>
          <RightClickMenu/>
        </div>

        <div>
          <Modal
              title="Create Group"
              onOk={handleCreateGroup}
              onCancel={closeCreateGroupDialog}
              visible={openCreateGroupDialog}
              width={520}
            >
              <Form layout="vertical" form={form} onFinish={handleCreateGroup}>
                <div className={'form-group' + (newGroupForm.submitted && !newGroup.name ? ' has-error' : '')}>
                  <Form.Item {...formItemLayout}
                    label="Name"
                    name="name"
                    rules={[
                        {
                          required: true,
                          pattern: new RegExp(
                            /^[a-zA-Z0-9_-]*$/
                          ),
                          message: "Please enter a valid Name"
                        }
                      ]}>
                    <Input id="name" name="name" onChange={e => setNewGroup({...newGroup, [e.target.name]: e.target.value})} placeholder="Name"/>
                  </Form.Item>
                </div>
                <Form.Item {...formItemLayout} label="Description" name="description">
                  <MarkdownEditor id="desc" name="description" onChange={e => setNewGroup({...newGroup, [e.target.name]: e.target.value})} targetDomId="fileDescr" value={newGroup.description} disabled={!editingAllowed}/>
                </Form.Item>
                </Form>
            </Modal>
       </div>
     </React.Fragment>

    )
};

export default withRouter(Assets)