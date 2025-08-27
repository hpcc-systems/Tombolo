import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Select, AutoComplete, message, Button, Col, Row } from 'antd';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import FileExplorerModal from '../files/FileExplorerModal';
import ObjectKeyValue from '../../common/ObjectKeyValue';

import styles from './superfileMonitoring.module.css';

const BasicTab = ({ selectedCluster, setSelectedCluster, superFileDetails, setSuperFileDetails, form, disabled }) => {
  useEffect(() => {
    if (superFileDetails === null) {
      return;
    }

    if (superFileDetails && superFileDetails.metaData) {
      selectSuperFile(superFileDetails.metaData.fileInfo.Name);
    }
  }, [superFileDetails]);

  const clusters = useSelector((state) => state.application.clusters);
  const [superFileVisibility, setSuperFileVisibility] = useState(false);
  const [superFileSuggestions, setSuperFileSuggestions] = useState([]);
  const [selectedSuperFile, setSelectedSuperFile] = useState('');
  const [displayFileInfo, setDisplayFileInfo] = useState();
  const { Option } = Select;

  const handleSuperFileSelect = async (selectedSuperFile) => {
    // console.log(selectedSuggestion);
    setSelectedSuperFile(selectedSuperFile);
    try {
      const url = '/api/hpcc/read/getSuperFileDetails?fileName=' + selectedSuperFile + '&clusterid=' + selectedCluster;
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) handleError(response);
      let fileInfo = await response.json();

      // File info is an object, cleaning it up and putting in array so it is easier to iterate and render
      const { cluster_id, superfile_name, size, modified } = fileInfo;

      fileInfo = {
        Cluster: cluster_id,
        Name: superfile_name,
        size: size,
        modified: modified,
      };

      let displayInfo = {
        Name: superfile_name,
        'Total Size': size / 1000 + ' KB',
        'Last Modified': new Date(modified).toLocaleString(),
      };

      setDisplayFileInfo(displayInfo);

      setSuperFileDetails(fileInfo);
    } catch (error) {
      console.log(error);
      message.error('There was an error getting file information from the cluster. Please try again');
    }
  };

  //loader to get suggestions
  const loadSuperFileSuggestions = async (searchText) => {
    setSelectedSuperFile(searchText);
    if (searchText.length <= 3) return;
    if (!searchText.match(/^[a-zA-Z0-9:_-]*$/)) {
      return message.error('Invalid search keyword. Please remove any special characters from the keyword.');
    }
    try {
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          keyword: searchText,
          clusterid: selectedCluster,
        }),
      };

      const response = await fetch('/api/hpcc/read/superfilesearch', options);
      if (!response.ok) handleError(response);

      const suggestions = await response.json();

      setSuperFileSuggestions(suggestions);
    } catch (error) {
      message.error('There was an error searching the files from cluster');
    }
  };

  const selectSuperFile = async (selectedSuggestion) => {
    //field doesn't get set if file browser sets value, so set it here for validation
    form.setFields([
      {
        name: 'fileName',
        value: selectedSuggestion,
      },
    ]);
    await handleSuperFileSelect(selectedSuggestion);
    setSelectedSuperFile(selectedSuggestion);
    setSuperFileVisibility(false);
  };

  return (
    <>
      <Form.Item
        label="Cluster"
        className="medium-form-item"
        name="cluster_id"
        disabled={disabled}
        rules={[{ required: true, message: 'Required field' }]}>
        <Select
          disabled={disabled}
          onChange={(value) => {
            setSelectedCluster(value);
          }}>
          {clusters.map((cluster) => {
            return (
              <Option key={cluster.id} value={cluster.id} disabled={disabled}>
                {cluster.name}
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      {selectedCluster ? (
        <>
          <Form.Item
            label="Search File"
            name="fileName"
            required
            disabled={disabled}
            rules={[{ required: true, message: 'Required field' }]}>
            <Row gutter={[8, 0]}>
              <Col className={styles.smallFormItem}>
                <AutoComplete
                  options={superFileSuggestions}
                  onSelect={handleSuperFileSelect}
                  onSearch={(searchText) => loadSuperFileSuggestions(searchText)}
                  value={selectedSuperFile}
                  disabled={disabled}
                />
              </Col>
              <Col>
                <Button htmlType="button" block onClick={() => setSuperFileVisibility(true)} type="primary">
                  Browse
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </>
      ) : null}

      {superFileVisibility ? (
        <>
          <FileExplorerModal
            open={true}
            onCancel={() => setSuperFileVisibility(false)}
            style={{ marginTop: '100px' }}
            onDone={selectSuperFile}
            cluster={selectedCluster}
            fileType="superfile"
          />
        </>
      ) : null}

      {superFileDetails ? (
        <>
          {displayFileInfo ? (
            <>
              <div className={styles.superFileDetailsHeader}>SuperFile Details</div>
              <div className={styles.superFileDetails}>
                <ObjectKeyValue obj={displayFileInfo} />
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default BasicTab;
