import React from 'react';
import { Modal } from 'antd';

import FileDetailsForm from './files/FileDetails';
import FileTemplate from './templates/FileTemplate';
import JobDetailsForm from './Jobs/JobDetails';
import IndexDetailsForm from './IndexDetails';
import QueryDetailsForm from './queries/QueryDetails';
import SubProcessDetails from './SubProcessDetails';
import { i18n } from '../common/Text';

function AssetDetailsDialog(props) {
  const getAssetType = (assetType) => {
    if (!assetType || typeof assetType !== 'string') return '';
    if (assetType === 'FileTemplate') return i18n('File Template');
    return i18n(assetType[0].toUpperCase() + assetType.slice(1));
  };

  return (
    <Modal
      open={props.show}
      onCancel={() => props.onClose()}
      width="1200px"
      footer={null}
      styles={{ display: 'flex', flexDirection: 'column' }}
      title={getAssetType(props.selectedAsset.type) + ` : ${props.selectedAsset.title}`}>
      <DetailsForm {...props} />
    </Modal>
  );
}

export default AssetDetailsDialog;

const DetailsForm = (props) => {
  const formOptions = {
    job: <JobDetailsForm {...props} />,
    file: <FileDetailsForm {...props} />,
    filetemplate: <FileTemplate {...props} />,
    index: <IndexDetailsForm {...props} />,
    query: <QueryDetailsForm {...props} />,
    'sub-process': <SubProcessDetails {...props} />,
  };

  const assetType = props.selectedAsset.type.toLowerCase();
  return formOptions[assetType];
};
