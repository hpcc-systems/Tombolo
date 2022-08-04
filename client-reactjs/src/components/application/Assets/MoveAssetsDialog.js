import React, { useState } from 'react';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { Modal, Button, Tree, message } from 'antd';
import { useSelector } from 'react-redux';
import { store } from '../../../redux/store/Store';
import { Constants } from '../../common/Constants';

const { DirectoryTree } = Tree;
const { confirm } = Modal;

function MoveAssetsDialog({ isShowing, toggle, application, assetToMove }) {
  const groupsTree = useSelector((state) => state.groupsReducer.tree);

  const [moveDestinationGroup, setMoveDestinationGroup] = useState({ id: '', key: '', title: '' });
  const [expandedGroups, setExpandedGroups] = useState(['0-0']);

  const onSelect = (keys, event) => {
    setMoveDestinationGroup({ id: event.node.id, key: event.node.key, title: event.node.title });
  };

  const onExpand = (expandedKeys) => {
    setExpandedGroups(expandedKeys);
  };

  const handleClose = () => {
    toggle({ refetch: false });
  };

  const handleMove = () => {
    message.config({ top: 130 });
    if (assetToMove.selectedKeys.id === moveDestinationGroup.id) {
      message.error(
        '"' +
          assetToMove.title +
          '" is already in "' +
          moveDestinationGroup.title +
          '" group. Please select a different group to move it.'
      );
      return;
    }
    confirm({
      title: 'Are you sure you want to move "' + assetToMove.title + '" to "' + moveDestinationGroup.title + '" group?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        fetch('/api/groups/move/asset', {
          method: 'put',
          headers: authHeader(),
          body: JSON.stringify({
            destGroupId: moveDestinationGroup.id,
            app_id: application.applicationId,
            assetType: assetToMove.type,
            assetId: assetToMove.id,
          }),
        })
          .then(function (response) {
            if (response.ok) {
              return response.json();
            }
            handleError(response);
          })
          .then(function (_data) {
            message.success(
              '"' + assetToMove.title + '" has been moved to "' + moveDestinationGroup.title + '" group.'
            );

            store.dispatch({
              type: Constants.MOVE_GROUP,
              payload: assetToMove.id,
            });
            toggle({ refetch: true });
          })
          .catch((error) => {
            console.log(error);
          });
      },
      onCancel() {},
    });
  };

  return (
    <React.Fragment>
      <div>
        <Modal
          title="Select Group to Move"
          visible={isShowing}
          width={520}
          footer={[
            <Button key="close" onClick={handleClose}>
              Cancel
            </Button>,
            <Button key="move" type="primary" onClick={handleMove}>
              Move
            </Button>,
          ]}>
          <DirectoryTree
            onSelect={onSelect}
            onExpand={onExpand}
            treeData={groupsTree}
            selectedKeys={[moveDestinationGroup.key]}
            expandedKeys={expandedGroups}
            defaultExpandAll={true}
          />
        </Modal>
      </div>
    </React.Fragment>
  );
}

export default MoveAssetsDialog;
