/* eslint-disable no-async-promise-executor */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tree, Button, Modal, Input, Dropdown, message } from 'antd';
import { debounce } from 'lodash';
import { DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router';

import { getRoleNameArray } from '../../common/AuthUtil.js';

import BreadCrumbs from '../../common/BreadCrumbs';
import { authHeader } from '../../common/AuthHeader.js';
import { selectGroup, getGroupsTree, groupsExpanded } from '@/redux/slices/GroupSlice';
import AssetsTable from './AssetsTable';
import TitleRenderer from './TitleRenderer.jsx';
import MoveAssetsDialog from './MoveAssetsDialog';
import useModal from '../../../hooks/useModal';
import { CreateGroupDialog } from './CreateGroupDialog';
import Text from '../../common/Text';
import InfoDrawer from '../../common/InfoDrawer';
import { assetInGroupSelected, newAsset, searchAsset } from '@/redux/slices/AssetSlice';

const { DirectoryTree } = Tree;
const { confirm } = Modal;
const { Search } = Input;
// const CheckboxGroup = Checkbox.Group;

const Assets = () => {
  const application = useSelector((state) => state.application.application);
  const assetInGroupId = useSelector((state) => state.asset.assetInGroupId);
  const groups = useSelector((state) => state.groups);

  const roleArray = getRoleNameArray();
  const editingAllowed = !(roleArray.includes('reader') && roleArray.length === 1);

  const dispatch = useDispatch();
  const history = useHistory();
  // const user = getUser();
  //TODO, get this from user roles to check if editing is allowed

  // all data related to file explorer is in redux
  const { selectedKeys, expandedKeys, tree, dataList } = groups;

  const { isShowing: showMoveDialog, toggle: toggleMoveDialog } = useModal();
  const { isShowing: showCreateGroup, toggle: toggleCreateGroup } = useModal();
  const prevSelectedApplicationRef = useRef();
  const defaultAssetTypeFilter = ['File', 'Job', 'Query', 'Indexes', 'Groups'];
  const searchOptions = [
    { label: <Text text="File" />, value: 'File' },
    { label: <Text text="Job" />, value: 'Job' },
    { label: <Text text="Query" />, value: 'Query' },
    { label: <Text text="Indexes" />, value: 'Indexes' },
    { label: <Text text="Groups" />, value: 'Groups' },
  ];
  const assetTypeFilter = useRef([...defaultAssetTypeFilter]);

  const [editGroup, setEditGroup] = useState({ edit: false, groupId: '' });
  const [itemToMove, setItemToMove] = useState({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [openHelp, setOpenHelp] = useState(false);

  const showDrawer = () => {
    setOpenHelp(true);
  };
  const onHelpDrawerClose = () => {
    setOpenHelp(false);
  };

  const fetchGroups = async () => {
    await dispatch(getGroupsTree(application.applicationId));
    clearSearch();
  };

  //Re-render Directory Tree when the tree structure us changed on modal
  useEffect(() => {
    //application changed
    if (application?.applicationId) {
      if (groups.tree.length === 0 || groups.error) {
        fetchGroups(); // run this function on initial load to populate tree and datalist;
      }
    }

    if (
      application &&
      prevSelectedApplicationRef.current &&
      application.applicationId !== prevSelectedApplicationRef.current.applicationId
    ) {
      dispatch(groupsExpanded(['0-0']));
      dispatch(selectGroup({ id: '', key: '0-0' }));
    }
    if (assetInGroupId) {
      openGroup(assetInGroupId);
    }

    prevSelectedApplicationRef.current = application;
  }, [assetInGroupId, application]);

  const clearSearch = () => {
    setSearchKeyword('');
    dispatch(searchAsset({ assetTypeFilter: '', keywords: '' }));
  };

  const onSelect = (keys, event) => {
    dispatch(selectGroup({ id: event.node.id, key: keys[0] }));
    clearSearch();
  };

  const onExpand = async (expandedKeys, _event) => {
    dispatch(groupsExpanded(expandedKeys));
  };

  const getParentKeys = (node, keys = ['0-0']) => {
    if (node.parentId) {
      keys.push(node.parentKey);
      const parent = dataList.find((group) => group.id === node.parentId);
      getParentKeys(parent, keys);
    }
    return keys;
  };
  const openGroup = (groupId) => {
    if (groupId === 'root') {
      dispatch(selectGroup({ id: '', key: '0-0' }));
    } else if (groupId) {
      const match = dataList.find((group) => group.id === parseInt(groupId));
      if (match) {
        const parentKeys = getParentKeys(match);
        const uniqueKeys = [...new Set([...expandedKeys, ...parentKeys])]; // will keep all previously opened keys plus new path
        dispatch(groupsExpanded(uniqueKeys));
        dispatch(selectGroup({ id: match.id, key: match.key }));
      }
    } else if (groupId === '') {
      dispatch(groupsExpanded(['0-0']));
      dispatch(selectGroup({ id: '', key: '0-0' }));
    }
    dispatch(assetInGroupSelected(''));
    clearSearch();
  };

  const openNewGroupDialog = ({ edit, groupId = '' }) => {
    if (edit) setEditGroup({ edit, groupId });
    toggleCreateGroup();
  };
  const closeCreateGroupDialog = (result) => {
    setEditGroup({ edit: false, groupId: '' });
    toggleCreateGroup();
    if (result) {
      result.saved && fetchGroups();
    }
  };

  const handleMenuClick = (e, group) => {
    const goTo = (point) => {
      dispatch(newAsset({ groupId: selectedKeys.id, applicationId: application.applicationId, isNew: true }));
      history.push(`/${application.applicationId}/assets/${point}`);
    };

    const actions = {
      Job: () => goTo('add-jobs'),
      File: () => goTo('file'),
      Index: () => goTo('index'),
      Query: () => goTo('query'),
      'File Template': () => goTo('fileTemplate'),
      Group: () => openNewGroupDialog({ edit: false, groupId: '' }),
      'Edit-Group': () => openNewGroupDialog({ edit: true, groupId: '' }),
      'Delete-Group': () => handleDeleteGroup(),
      'Move-Group': () => openMoveAssetDialog({ ...group, type: 'Group' }),
    };

    const runAction = actions[e.key];
    if (runAction) runAction();
  };

  const handleDeleteGroup = () => {
    confirm({
      title: 'Are you sure you want to delete this Group?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return new Promise(async (resolve, reject) => {
          try {
            const options = {
              method: 'DELETE',
              headers: authHeader(),
              body: JSON.stringify({ group_id: selectedKeys.id, app_id: application.applicationId }),
            };

            const response = await fetch('/api/groups', options);
            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.message || 'Failed to delete group');
            }

            const selectedGroup = dataList.find((group) => group.id === selectedKeys.id);
            dispatch(selectGroup({ id: selectedGroup.parentId, key: selectedGroup.parentKey }));
            fetchGroups();
            resolve();
          } catch (error) {
            message.error(error.message);
            reject();
          }
        });
      },
      onCancel() {},
    });
  };

  const handleEditGroup = (groupIdFromAssetsView) => {
    openNewGroupDialog({ edit: true, groupId: groupIdFromAssetsView });
  };

  const openMoveAssetDialog = (asset) => {
    setItemToMove({ ...asset, selectedKeys });
    toggleMoveDialog();
  };

  const closeMoveAssetDialog = async ({ refetch }) => {
    if (refetch) {
      await fetchGroups();
    }
    toggleMoveDialog();
    setItemToMove({});
  };

  const handleDragEnter = () => {};
  const handleDragDrop = (info) => {
    if (info.node !== undefined && info.dragNode !== undefined) {
      confirm({
        title: 'Are you sure you want to move "' + info.dragNode.title + '" to "' + info.node.title + '" group?',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk() {
          return new Promise(async (resolve, reject) => {
            try {
              const options = {
                headers: authHeader(),
                method: 'PUT',
                body: JSON.stringify({
                  groupId: info.dragNode.id,
                  destGroupId: info.node.id,
                  app_id: application.applicationId,
                }),
              };

              const response = await fetch('/api/groups/move', options);
              if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to move group');
              }

              fetchGroups();
              resolve();
            } catch (error) {
              message.error(error.message);
              reject();
            }
          });
        },
      });
    }
  };

  const handleAssetSearch = useCallback(
    debounce((value, _event) => {
      if (assetTypeFilter.current.length === 0) return message.error('Please select at least one asset type');
      const assetFilter =
        assetTypeFilter.current.length !== searchOptions.length ? assetTypeFilter.current.join(',') : '';
      dispatch(searchAsset({ assetTypeFilter: assetFilter, keywords: value }));
    }, 300),
    [assetTypeFilter.current]
  );

  const handleSearchKeywordChange = (e) => {
    setSearchKeyword(e.target.value);
    handleAssetSearch(e.target.value); // this function is memoised and debounced, it will not on every keyhit
  };

  const titleRenderer = (nodeData) => {
    return <TitleRenderer nodeData={nodeData} handleMenuClick={handleMenuClick} />;
  };

  const menuItems = [
    { key: 'File', icon: <i className="fa fa-lg fa-file"></i>, label: 'File' },
    { key: 'File Template', icon: <i className="fa  fa-lg fa-file-text-o"></i>, label: 'File Template' },
    { key: 'Job', icon: <i className="fa fa-lg fa-clock-o"></i>, label: 'Job' },
    { key: 'Query', icon: <i className="fa fa-lg fa-search"></i>, label: 'Query' },
    { key: 'Index', icon: <i className="fa fa-lg fa-indent"></i>, label: 'Index' },
  ];

  return (
    <React.Fragment>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <BreadCrumbs
          extraContent={
            editingAllowed ? (
              <div style={{ marginRight: '5px' }}>
                <InfoCircleOutlined style={{ marginRight: '10px', fontSize: '18px' }} onClick={() => showDrawer()} />

                <Dropdown menu={{ items: menuItems, onClick: (e) => handleMenuClick(e) }}>
                  <Button type="primary" icon={<DownOutlined style={{ marginRight: '5px' }} />}>
                    {<Text text="Add Asset" />}
                  </Button>
                </Dropdown>
              </div>
            ) : null
          }
        />

        <div style={{ display: 'flex', height: '100%' }}>
          <div className="groups-div">
            <Search
              id="search-field"
              allowClear
              value={searchKeyword}
              // addonBefore={selectBefore}
              placeholder={'Search assets'}
              onSearch={handleAssetSearch}
              onChange={handleSearchKeywordChange}
              disabled={false}
            />

            <DirectoryTree
              draggable
              treeData={tree}
              blockNode={true}
              onSelect={onSelect}
              onExpand={onExpand}
              autoExpandParent={false}
              className="draggable-tree"
              titleRender={titleRenderer}
              onDrop={handleDragDrop}
              onDragEnter={handleDragEnter}
              selectedKeys={[selectedKeys.key]}
              expandedKeys={[...expandedKeys]}
            />
          </div>
          <div className="asset-table">
            <AssetsTable
              openGroup={openGroup}
              refreshGroups={fetchGroups}
              handleEditGroup={handleEditGroup}
              editingAllowed={editingAllowed}
            />
          </div>
        </div>
      </div>

      {showCreateGroup ? (
        <CreateGroupDialog
          editGroup={editGroup}
          isShowing={showCreateGroup}
          toggle={closeCreateGroupDialog}
          applicationId={application.applicationId}
        />
      ) : null}

      {showMoveDialog ? (
        <MoveAssetsDialog
          assetToMove={itemToMove}
          isShowing={showMoveDialog}
          toggle={closeMoveAssetDialog}
          application={application}
        />
      ) : null}
      <InfoDrawer open={openHelp} onClose={onHelpDrawerClose} width="25%" content="assets"></InfoDrawer>
    </React.Fragment>
  );
};

export default Assets;
