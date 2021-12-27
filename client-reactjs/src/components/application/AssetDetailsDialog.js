import React, { useEffect } from 'react';
import useFileDetailsForm from '../../hooks/useFileDetailsForm';
import { useSelector } from 'react-redux';
import { Modal } from 'antd/lib';

function AssetDetailsDialog(props) {
  const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();
  const authReducer = useSelector((state) => state.authenticationReducer);

  useEffect(() => {
    if (props.assetId) toggle();
  }, [props.assetId]);

  const handleClose = () => {
    toggle();
    //flip the state in the parent component
    props.handleClose();
  };

  const capitalize = (word) => {
    if (!word || typeof word !== 'string') return '';
    return word[0].toUpperCase() + word.slice(1);
  };

  const detailsFormProps = { ...props, isNew: false, onClose: handleClose, displayingInModal: true, type: props.assetType };

  return authReducer.user && authReducer.user.token ? (
    <React.Fragment>
      <Modal
        width='1200px'
        footer={null}
        visible={isShowing}
        onCancel={handleClose}
        bodyStyle={{ display: 'flex', flexDirection: 'column' }}
        title={`${capitalize(props.assetType)} : ${props.title}`}
      >
        <OpenDetailsForm {...detailsFormProps} />
      </Modal>
    </React.Fragment>
  ) : null;
}

export default AssetDetailsDialog;
