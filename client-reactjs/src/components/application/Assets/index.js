/* eslint-disable no-async-promise-executor */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tree, Menu, Button, Modal, Input, Dropdown, Checkbox, message, Popover } from 'antd';
import { debounce } from 'lodash';
import { DownOutlined, SettingOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router';

import BreadCrumbs from '../../common/BreadCrumbs';
import { authHeader } from '../../common/AuthHeader.js';
import { hasEditPermission } from '../../common/AuthUtil.js';
import { assetsActions } from '../../../redux/actions/Assets';
import { getGroupsTree, selectGroup, expandGroups } from '../../../redux/actions/Groups';
import AssetsTable from './AssetsTable';
import TitleRenderer from './TitleRenderer.js';
import MoveAssetsDialog from './MoveAssetsDialog';
import useModal from '../../../hooks/useModal';
import SelectDetailsForPdfDialog from '../Assets/pdf/SelectDetailsForPdfDialog';
import { getNestedAssets } from '../Assets/pdf/downloadPdf';
import { CreateGroupDialog } from './CreateGroupDialog';
import Text from '../../common/Text';

const { DirectoryTree } = Tree;
const { confirm } = Modal;
const { Search } = Input;
const CheckboxGroup = Checkbox.Group;

message.config({ top: 100 });

const Assets = () => {
  const [groupsReducer, authReducer, assetReducer, applicationReducer] = useSelector((state) => [
    state.groupsReducer,
    state.authenticationReducer,
    state.assetReducer,
    state.applicationReducer,
  ]);
  const dispatch = useDispatch();
  const history = useHistory();
  const editingAllowed = hasEditPermission(authReducer.user);
  // all data related to file explorer is in redux
  const { selectedKeys, expandedKeys, tree, dataList } = groupsReducer;
  const application = applicationReducer.application;
  //id of the group clicked from Asset table after a search
  const { assetInGroupId } = assetReducer;
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
  const [selectDetailsforPdfDialogVisibility, setSelectDetailsforPdfDialogVisibility] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState();
  const [toPrintAssets, setToPrintAssets] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchGroups = async () => {
    await dispatch(getGroupsTree(application.applicationId));
    clearSearch();
  };

  //Re-render Directory Tree when the tree structure us chaged on modal
  useEffect(() => {
    //application changed
    if (application?.applicationId) {
      if (groupsReducer.tree.length === 0 || groupsReducer.error) {
        fetchGroups(); // run this function on initial load to populate tree and datalist;
      }
    }

    if (
      application &&
      prevSelectedApplicationRef.current &&
      application.applicationId !== prevSelectedApplicationRef.current.applicationId
    ) {
      dispatch(expandGroups(['0-0']));
      dispatch(selectGroup({ id: '', key: '0-0' }));
    }
    if (assetInGroupId) {
      openGroup(assetInGroupId);
    }

    prevSelectedApplicationRef.current = application;
  }, [assetInGroupId, application]);

  const clearSearch = () => {
    setSearchKeyword('');
    dispatch(assetsActions.searchAsset('', ''));
  };

  const onSelect = (keys, event) => {
    dispatch(selectGroup({ id: event.node.id, key: keys[0] }));
    clearSearch();
  };

  const onExpand = async (expandedKeys, _event) => {
    dispatch(expandGroups(expandedKeys));
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
        dispatch(expandGroups(uniqueKeys));
        dispatch(selectGroup({ id: match.id, key: match.key }));
      }
    } else if (groupId === '') {
      dispatch(expandGroups(['0-0']));
      dispatch(selectGroup({ id: '', key: '0-0' }));
    }
    dispatch(assetsActions.assetInGroupSelected(''));
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

  const handlePrintAssets = () => {
    getNestedAssets(
      application.applicationId,
      setSelectedAsset,
      setSelectDetailsforPdfDialogVisibility,
      { ...selectedKeys, type: 'Group' },
      setToPrintAssets
    );
  };

  const handleMenuClick = (e, group) => {
    const goTo = (point) => {
      dispatch(assetsActions.newAsset(application.applicationId, selectedKeys.id));
      history.push(`/${application.applicationId}/assets/${point}`);
    };

    const actions = {
      Job: () => goTo('add-jobs'),
      File: () => goTo('file'),
      Index: () => goTo('index'),
      Query: () => goTo('query'),
      'RealBI Dashboard': () => goTo('visualizations'),
      'File Template': () => goTo('fileTemplate'),
      Group: () => openNewGroupDialog({ edit: false, groupId: '' }),
      'Edit-Group': () => openNewGroupDialog({ edit: true, groupId: '' }),
      'Delete-Group': () => handleDeleteGroup(),
      'Move-Group': () => openMoveAssetDialog({ ...group, type: 'Group' }),
      'Print-Assets': () => handlePrintAssets(),
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
            console.log('-deleteError-----------------------------------------');
            console.dir(error, { depth: null });
            console.log('------------------------------------------');
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
              console.log('-deleteError-----------------------------------------');
              console.dir(error, { depth: null });
              console.log('------------------------------------------');
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
      dispatch(assetsActions.searchAsset(assetFilter, value));
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

  const onAssetTypeFilterChange = (selectedValues) => {
    assetTypeFilter.current = selectedValues;
  };

  const menu = (
    <Menu onClick={(e) => handleMenuClick(e)}>
      <Menu.Item key="File">
        <i className="fa fa-lg fa-file"></i> {<Text text="File" />}
      </Menu.Item>
      <Menu.Item key="File Template">
        <i className="fa  fa-lg fa-file-text-o"></i> {<Text text="File Template" />}
      </Menu.Item>
      <Menu.Item key="Index">
        <i className="fa fa-lg fa-indent"></i> {<Text text="Index" />}
      </Menu.Item>
      <Menu.Item key="Query">
        <i className="fa fa-lg fa-search"></i> {<Text text="Query" />}
      </Menu.Item>
      <Menu.Item key="Job">
        <i className="fa fa-lg fa-clock-o"></i> {<Text text="Job" />}
      </Menu.Item>
      <Menu.Item key="RealBI Dashboard">
        <i className="fa fa-lg fa-area-chart"></i> {<Text text="RealBI Dashboard" />}
      </Menu.Item>
    </Menu>
  );

  const selectBefore = (
    <Popover
      title={<Text text="Search Filters" />}
      placement="bottom"
      trigger="click"
      content={
        <CheckboxGroup
          options={searchOptions}
          onChange={onAssetTypeFilterChange}
          defaultValue={assetTypeFilter.current}
          style={{ display: 'flex', flexDirection: 'column' }}
        />
      }>
      <SettingOutlined />
    </Popover>
  );

  //Generate PDF & printing task complete function
  const printingTaskCompleted = () => {
    setSelectDetailsforPdfDialogVisibility(false);
  };

  return (
    <React.Fragment>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <BreadCrumbs
          extraContent={
            editingAllowed ? (
              <Dropdown overlay={menu}>
                <Button type="primary" icon={<DownOutlined />}>
                  {<Text text="Add Asset" />}
                </Button>
              </Dropdown>
            ) : null
          }
        />

        <div style={{ display: 'flex', height: '100%' }}>
          <div className="groups-div">
            <Search
              id="search-field"
              allowClear
              value={searchKeyword}
              addonBefore={selectBefore}
              placeholder={<Text text="Search assets" />}
              onSearch={handleAssetSearch}
              onChange={handleSearchKeywordChange}
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
              onScroll={(e) => console.log(e)}
            />
          </div>
          <div className="asset-table">
            <AssetsTable openGroup={openGroup} refreshGroups={fetchGroups} handleEditGroup={handleEditGroup} />
          </div>
        </div>
      </div>

      {showCreateGroup ? (
        <CreateGroupDialog
          editGroup={editGroup}
          isShowing={showCreateGroup}
          toggle={closeCreateGroupDialog}
          applicationId={applicationReducer.application.applicationId}
        />
      ) : null}

      {showMoveDialog ? (
        <MoveAssetsDialog
          assetToMove={itemToMove}
          isShowing={showMoveDialog}
          toggle={closeMoveAssetDialog}
          application={applicationReducer.application}
        />
      ) : null}

      {/* Dialog box to select which element to export as PDF */}
      {selectDetailsforPdfDialogVisibility ? (
        <SelectDetailsForPdfDialog
          selectedAsset={selectedAsset}
          toPrintAssets={toPrintAssets}
          visible={selectDetailsforPdfDialogVisibility}
          printingTaskCompleted={printingTaskCompleted}
          setVisiblity={setSelectDetailsforPdfDialogVisibility}
        />
      ) : null}
    </React.Fragment>
  );
};

export default Assets;
