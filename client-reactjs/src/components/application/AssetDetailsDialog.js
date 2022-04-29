import React from 'react'
import { Modal } from 'antd/lib';

import FileDetailsForm from './FileDetails';
import FileTemplate from './templates/FileTemplate'
import JobDetailsForm from './Jobs/JobDetails';
import IndexDetailsForm from './IndexDetails';
import QueryDetailsForm from './QueryDetails';

function AssetDetailsDialog(props) {  
  
  const capitalize = (word) => {
    if (!word || typeof word !== 'string') return '';
    return word[0].toUpperCase() + word.slice(1);
  };

  const DetailsForm = (props) =>{
    const formOptions ={
      job: <JobDetailsForm {...props}/>,
      file: <FileDetailsForm {...props} />,
      filetemplate : <FileTemplate {...props} />,
      index: <IndexDetailsForm {...props}/>,
      query: <QueryDetailsForm  {...props}/>
    }
    const jobType = props.selectedJobType.toLowerCase();
    return formOptions[jobType];
  } 

  return(
    <Modal
      visible={props.show}
      onCancel={()=>props.onClose()}
      width="1200px"
      footer={null}
      bodyStyle={{display: "flex", flexDirection: "column"}}
      title={`${capitalize(props.selectedJobType)} : ${props.selectedNodeTitle}`}
      > 
      <DetailsForm {...props} />
    </Modal>
	)
}

export default AssetDetailsDialog;
