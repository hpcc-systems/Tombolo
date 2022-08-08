import React, { useState } from 'react';
import DeleteAssetModal from './DeleteAssetModal';
/*
  - On click component will show a modal that will check if Asset exists in any of the dataflows, and present user with corresponding message.
  - We want to prevent user from deleting asset that is currently used in dataflows to avoid workflows failure.
    component prop will be shown as a clickable component that will call modal, you dont have to pass onClick, it is done inside DeleteAsset itself.
  - Styles prop will be applied to outer wrapper div to position element. 
  - Asset prop is an object that expects { id:<assetId>,  type: [Job, File, Index, Group ],  title: <asset title or name>}
*/
const DeleteAsset = ({ asset, onDelete, style = null, component }) => {
  const [visible, setVisible] = useState(false);
  const hideModal = () => setVisible(false);
  const showModal = () => setVisible(true);

  return (
    <div style={style}>
      {React.cloneElement(component, { onClick: showModal })}
      <DeleteAssetModal show={visible} asset={asset} hide={hideModal} onDelete={onDelete} />
    </div>
  );
};

export default DeleteAsset;
