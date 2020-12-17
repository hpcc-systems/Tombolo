import React, { useState, useEffect } from 'react'
import { authHeader, handleError } from "../common/AuthHeader.js"
import useFileDetailsForm from '../../hooks/useFileDetailsForm';
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Modal, Button } from 'antd/lib';

function AssetDetailsDialog(props) {
  const [application, setApplication] = useState({...props})

	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();

  let {assetType, applicationId, assetId} = useParams();

  useEffect(() => {
  	setApplication({...props});
    if(props.assetId != '') {
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
      "type": props.assetType,
      "isNew":false,
      "selectedAsset": props.assetId,
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
          footer={[
            <Button type="primary" key="close" onClick={handleClose}>
              Close
            </Button>
          ]}
        >
				<DetailsForm assetType={props.assetType} fileId={props.fileId} application={props.application} user={props.user}/>
      </Modal>
	  </React.Fragment>
	  : null

	)
}
export default AssetDetailsDialog