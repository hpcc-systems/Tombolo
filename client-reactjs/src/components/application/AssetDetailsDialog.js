import React from 'react'
import { Modal } from 'antd';

import FileDetailsForm from './FileDetails';
import FileTemplate from './templates/FileTemplate'
import JobDetailsForm from './Jobs/JobDetails';
import IndexDetailsForm from './IndexDetails';
import QueryDetailsForm from './QueryDetails';
import SubProcessDetails from './SubProcessDetails';

function AssetDetailsDialog(props) {
  
  const capitalize = (word) => {
    if (!word || typeof word !== 'string') return '';
    return word[0].toUpperCase() + word.slice(1);
  };

  return(
    <Modal
      visible={props.show}
      onCancel={()=>props.onClose()}
      width="1200px"
      footer={null}
      bodyStyle={{display: "flex", flexDirection: "column"}}
      title={`${capitalize(props.selectedAsset.type)} : ${props.selectedAsset.title}`}
      > 
      <DetailsForm {...props} />
    </Modal>
	)
}

export default AssetDetailsDialog;

const DetailsForm = (props) =>{
  const formOptions ={
    job: <JobDetailsForm {...props}/>,
    file: <FileDetailsForm {...props} />,
    filetemplate : <FileTemplate {...props} />,
    index: <IndexDetailsForm {...props}/>,
    query: <QueryDetailsForm  {...props}/>,
    'sub-process': <SubProcessDetails  {...props} />,
  }

  const assetType = props.selectedAsset.type.toLowerCase();
  return formOptions[assetType];
};
