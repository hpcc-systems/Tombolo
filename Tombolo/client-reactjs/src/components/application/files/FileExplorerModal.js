import React, { useEffect, useState } from 'react';

import Text from '../../common/Text';
import { authHeader } from '../../common/AuthHeader.js';
import { Modal, Cascader, message } from 'antd';

function FileExplorerModal({ open, onCancel, onDone, fileType, cluster, style }) {
  const [options, setOptions] = useState([]);
  const [selectedLogicalFile, setSelectedLogicalFile] = useState('');

  useEffect(() => {
    if (cluster) {
      loadInitialData();
    }
  }, [cluster]);

  //Get logical file /directory
  const getLogicalFile = async (scope) => {
    try {
      let url = '';
      if (fileType == 'superfile') {
        url = `/api/file/read/browseSuperFile/${cluster}/${scope}`;
      } else {
        url = `/api/file/read/browseLogicalFile/${cluster}/${scope}`;
      }
      const options = {
        method: 'GET',
        headers: authHeader(),
      };

      const response = await fetch(url, options);
      if (response.status != 200) {
        throw new Error('Unable to search file from selected cluster');
      }
      const data = await response.json();

      return data;
    } catch (err) {
      message.error(err.message);
    }
  };

  //Load initial data
  const loadInitialData = async () => {
    let initialData;

    if (fileType == 'superfile') {
      initialData = await getLogicalFile('*');
    } else {
      initialData = await getLogicalFile('$');
    }

    setOptions(initialData);
  };

  //Load new data.
  const loadData = async (selectedOptions) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    const scopeArray = selectedOptions.map((selectedOption) => {
      return selectedOption.value;
    });
    const scope = scopeArray.join('::');

    const newOptions = await getLogicalFile(scope);
    targetOption.loading = false;
    targetOption.children = newOptions;
    setOptions([...options]);
  };

  let greeting;
  if (fileType == 'superfile') {
    greeting = 'Browse Super Files';
  } else {
    greeting = 'Browse Logical Files';
  }

  return (
    <>
      <Modal
        style={style}
        title={<Text>{greeting}</Text>}
        open={open}
        onCancel={onCancel}
        onOk={() => onDone(selectedLogicalFile)}
        maskClosable={false}
        width={800}>
        <Cascader
          style={{ width: '100%' }}
          options={options}
          loadData={loadData}
          onChange={(value) => {
            let selectedFile;
            if (fileType == 'superfile') {
              selectedFile = value.join('::');
            } else {
              selectedFile = value[value.length - 1];
            }
            setSelectedLogicalFile(selectedFile);
          }}
          displayRender={(label, selectedOptions) => {
            let selectedFile;
            if (fileType == 'superfile') {
              selectedFile = selectedOptions[selectedOptions.length - 1]?.fullName;
            } else {
              selectedFile = selectedOptions[selectedOptions.length - 1]?.value;
            }
            return selectedFile;
          }}
        />
      </Modal>
    </>
  );
}

export default FileExplorerModal;
