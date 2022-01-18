import React, {  useEffect } from 'react'
import useFileDetailsForm from '../../hooks/useFileDetailsForm';
import { useSelector } from "react-redux";
import { Modal } from 'antd/lib';

function AssetDetailsDialog(props) {

	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();
  const authReducer = useSelector(state => state.authenticationReducer);

  useEffect(() => {
    console.log("asetdialogprops", props)
    if (props.selectedAsset.id)  toggle(); // opens dialog
  }, [props.selectedAsset.id])

  const handleClose = () => {
    toggle();
    props.handleClose();
  }

  const capitalize = (word) => {
    if (!word || typeof word !== 'string') return '';
    return word[0].toUpperCase() + word.slice(1);
  };

  return(
    <>
      {authReducer.user?.token ?
	    <Modal
          visible={isShowing}
          width="1200px"
          onCancel={handleClose}
          footer={null}
          bodyStyle={{display: "flex", flexDirection: "column"}}
          title={`${capitalize(props.selectedJobType)} : ${props.selectedNodeTitle}`}
          > 
        <OpenDetailsForm
          {...props}
          type={props.selectedJobType} // OpenDetailsForm needs this prop
          viewMode={true} // ?
          displayingInModal={true} // ?
          fileId={props.selectedAsset.id} // ?
          onClose={handleClose} 
        />
      </Modal>
	
	  : null}
    </>
	)
}

export default AssetDetailsDialog
