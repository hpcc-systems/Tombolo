import React, { useState, useEffect } from 'react'
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Modal, Button, Tree, message } from 'antd/lib';
const { TreeNode, DirectoryTree } = Tree;
const { confirm } = Modal;

function MoveAssetsDialog({isShowing, toggle, application, assetToMove, reloadTable}) {
  const [moveDestinationGroup, setMoveDestinationGroup] = useState({id:'', key:''});
  const [treeData, setTreeData] = useState([]);

  useEffect(() => {
    if(application && application.applicationId) {
      fetchGroups();
    }
  }, [application]);

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
      setMoveDestinationGroup({'id':data[0].id, 'key':data[0].key})
    }).catch(error => {
      console.log(error);
    });
  }

  const onSelect = (keys, event) => {
    setMoveDestinationGroup({id:event.node.props.id, key:event.node.props.eventKey, title: event.node.props.title})
  };

  const handleClose = () => {
    toggle();
  }

  const handleMove = () => {
    message.config({top:130})
    if(assetToMove.selectedGroup.id == moveDestinationGroup.id) {
      message.error('"'+assetToMove.title + '" is already in "'+moveDestinationGroup.title+'" group. Please select a different group to move it.')
      return;
    }
    confirm({
      title: 'Are you sure you want to move "'+assetToMove.title+ '" to "'+moveDestinationGroup.title+ '" group?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        fetch('/api/groups/move/asset', {
          method: 'put',
          headers: authHeader(),
          body: JSON.stringify({
            "destGroupId": moveDestinationGroup.id,
            "app_id": application.applicationId,
            "assetType": assetToMove.type,
            "assetId": assetToMove.id
          })
        }).then(function(response) {
          if(response.ok) {
            return response.json();
          }

          handleError(response);
        }).then(function(data) {
          message.success('"'+assetToMove.title+'" has been moved to "'+moveDestinationGroup.title+'" group.')
          reloadTable();
          handleClose();
        }).catch(error => {
          console.log(error);
        });
      },
      onCancel() {
      },
    });


  }

  const onExpand = () => {
    console.log('MoveAssetsDialogTrigger Expand');
  }
  return (
    <React.Fragment>
      <div>
        <Modal
          title="Move Asset"
          visible={isShowing}
          width={520}
          footer={[
            <Button key="close" onClick={handleClose}>
              Close
            </Button>,
            <Button key="move" type="primary" onClick={handleMove}>
              Move
            </Button>
          ]}
          >
            <DirectoryTree
              onSelect={onSelect}
              onExpand={onExpand}
              treeData={treeData}
              selectedKeys={[moveDestinationGroup.key]}
              defaultExpandAll={true}/>
         </Modal>
      </div>
     </React.Fragment>
    )

}

export default MoveAssetsDialog