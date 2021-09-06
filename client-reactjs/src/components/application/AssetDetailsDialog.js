import React, { useState, useEffect } from 'react'
import { authHeader, handleError } from "../common/AuthHeader.js"
import useFileDetailsForm from '../../hooks/useFileDetailsForm';
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Modal, Button } from 'antd/lib';
import _ from "lodash";

function AssetDetailsDialog(props) {
  const [application, setApplication] = useState({...props});

	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();

  let { assetType, applicationId, assetId, selectedDataflow } = useParams();

  useEffect(() => {
  	setApplication({...props});
    if (props.assetId != '') {
      handleOpen();
    }
  }, [props.assetId])

  const authReducer = useSelector(state => state.authenticationReducer);

  const handleOpen = () => {
    toggle();
  }

  const handleClose = () => {
    toggle();
    //flip the state in the parent component
    props.handleClose();
  }

  const DetailsForm = props => {
    return OpenDetailsForm({
      ...props,
      "type": props.assetType,
      "isNew":false,
      "selectedAsset": props.selectedAsset,
      "selectedDataflow": props.selectedDataflow,
      "nodes": props.nodes,
      "edges": props.edges,
      "nodeIndex": props.nodeIndex,
      "application": props.application,
      "user": props.user,
      "onClose": handleClose,
      "viewMode": true
    })
  }

  return (
	  (authReducer.user && authReducer.user.token != undefined) ?
	  <React.Fragment>
	    <Modal
          visible={isShowing}
          width="1200px"
          onCancel={handleClose}
          footer={null}
          bodyStyle={{display: "flex", flexDirection: "column"}}
          title={_.startCase(_.toLower(props.assetType)) + " : " +   props.title}
        >
        <DetailsForm
          assetType={props.assetType}
          assetId={props.assetId}
          fileId={props.fileId}
          application={props.application}
          user={props.user}
          selectedDataflow={props.selectedDataflow}
          nodes={props.nodes}
          edges={props.edges}
          nodeIndex={props.nodeIndex}
          displayingInModal={true}
          reload={props.reload}
          onAssetSaved={props.onAssetSaved}
        />
      </Modal>
	  </React.Fragment>
	  : null

	)
}

export default AssetDetailsDialog
