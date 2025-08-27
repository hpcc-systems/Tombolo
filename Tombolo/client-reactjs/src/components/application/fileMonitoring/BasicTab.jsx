import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Select, AutoComplete, message, Input, Button, Col, Row } from 'antd';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import LandingZoneFileExplorer from '../../common/LandingZoneFileExplorer';
import FileExplorerModal from '../files/FileExplorerModal';
import ObjectKeyValue from '../../common/ObjectKeyValue';

const { Option } = Select;

const monitoringFileTypes = [
  { name: 'Logical Files', value: 'logicalFiles' },
  { name: 'Landingzone Files', value: 'landingZoneFile' },
];

function FileMonitoringBasicTab({
  selectedCluster,
  setSelectedCluster,
  basicTabForm,
  selectedFileDetails,
  setSelectedFileDetails,
  monitoringAssetType,
  setMonitoringAssetType,
  selectedFileMonitoringDetails,
}) {
  const clusters = useSelector((state) => state.application.clusters); // List of cluster from redux-store. Clusters that are already added to DB
  const [selectedFile, setSelectedFile] = useState('');
  const [fileSuggestions, setFileSuggestions] = useState([]);
  const [_landingZoneRootPath, setLandingZoneRootPath] = useState('');
  const [logicalFileExplorerVisible, setLogicalFileVisibility] = useState(false);

  // Populate the monitoring details if viewing existing monitoring ---------------------------------
  useEffect(() => {
    if (selectedFileMonitoringDetails === null) return;
    const { monitoringAssetType, cluster_id } = selectedFileMonitoringDetails;

    setMonitoringAssetType(monitoringAssetType);
    setSelectedCluster(cluster_id);
    basicTabForm.setFieldsValue({ monitoringAssetType, cluster_id });

    if (monitoringAssetType === 'logicalFiles') {
      const {
        metaData: {
          fileInfo: {
            Name,
            Dir,
            Filesize,
            Wuid,
            Owner,
            Modified,
            isSuperfile,
            ContentType,
            IsCompressed,
            IsRestricted,
          },
        },
      } = selectedFileMonitoringDetails;

      setSelectedFile(Name);
      const fileInfo = {
        Name,
        Dir,
        Filesize: Filesize + ' KB',
        Wuid,
        Owner,
        Modified,
        isSuperfile,
        ContentType,
        IsCompressed,
        IsRestricted,
      };
      setSelectedFileDetails(fileInfo);
    }
    if (monitoringAssetType === 'landingZoneFile') {
      const {
        metaData: {
          fileInfo: { landingZone, machine, dirToMonitor, fileName },
        },
      } = selectedFileMonitoringDetails;
      basicTabForm.setFieldsValue({ landingZone, machine, dirToMonitor, fileName });
    }
  }, [selectedFileMonitoringDetails]);

  // Load logical file  Suggestions ------------------------------------------------------------------
  // TODO- debounce+
  const loadFileSuggestions = async (searchText) => {
    setSelectedFile(searchText);
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

      const response = await fetch('/api/hpcc/read/filesearch', options);
      if (!response.ok) handleError(response);

      const suggestions = await response.json();

      setFileSuggestions(suggestions);
    } catch (error) {
      message.error('There was an error searching the files from cluster');
    }
  };

  //When file is selected -------------------------------------------------------------
  const handleFileSelect = async (selectedSuggestion) => {
    // console.log(selectedSuggestion);
    // setSelectedFile(selectedSuggestion);
    try {
      const url =
        '/api/hpcc/read/getLogicalFileDetails?fileName=' + selectedSuggestion + '&clusterid=' + selectedCluster;
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) handleError(response);
      let fileInfo = await response.json();

      // File info is an object, cleaning it up and putting in array so it is easier to iterate and render
      const {
        Name,
        Dir,
        FileSizeInt64: fileSizeInByes,
        Wuid,
        Owner,
        Modified,
        isSuperfile,
        ContentType,
        IsCompressed,
        IsRestricted,
      } = fileInfo;

      fileInfo = {
        Name,
        Dir,
        Filesize: fileSizeInByes / 1000,
        Wuid,
        Owner,
        Modified,
        isSuperfile,
        ContentType,
        IsCompressed,
        IsRestricted,
      };
      setSelectedFileDetails(fileInfo);
    } catch (error) {
      console.log(error);
      message.error('There was an error getting file information from the cluster. Please try again');
    }
  };

  // When file is selected using the logical file explorer -------------------------------------------------
  const selectFileFromLogicalFileExplorer = async (selectedSuggestion) => {
    await handleFileSelect(selectedSuggestion);
    setSelectedFile(selectedSuggestion);
    setLogicalFileVisibility(false);
  };

  return (
    <>
      {logicalFileExplorerVisible ? (
        <FileExplorerModal
          open={true}
          onCancel={() => setLogicalFileVisibility(false)}
          style={{ marginTop: '100px' }}
          onDone={selectFileFromLogicalFileExplorer}
          cluster={selectedCluster}
        />
      ) : null}

      <Form form={basicTabForm} layout="vertical">
        <Form.Item
          label="Monitor"
          className="medium-form-item"
          name="monitoringAssetType"
          rules={[{ required: true, message: 'Required filed' }]}>
          <Select
            onChange={(value) => {
              setMonitoringAssetType(value);
            }}
            options={monitoringFileTypes}></Select>
        </Form.Item>

        {monitoringAssetType ? (
          <Form.Item
            label="Cluster"
            className="medium-form-item"
            name="cluster_id"
            rules={[{ required: true, message: 'Required filed' }]}>
            <Select
              onChange={(value) => {
                setSelectedCluster(value);
              }}>
              {clusters.map((cluster) => {
                return (
                  <Option key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        ) : null}

        {monitoringAssetType === 'landingZoneFile' ? (
          <LandingZoneFileExplorer
            clusterId={selectedCluster}
            DirectoryOnly={true}
            setLandingZoneRootPath={setLandingZoneRootPath}
            selectedMonitoring={selectedFileMonitoringDetails}
            enableEdit={true}
            form={basicTabForm}
          />
        ) : null}

        {monitoringAssetType === 'landingZoneFile' ? (
          <Form.Item
            label="File Name"
            name="fileName"
            extra="Supports wildcards"
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              { required: true, message: 'Required filed' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}>
            <Input placeholder="*"></Input>
          </Form.Item>
        ) : null}

        {selectedCluster && monitoringAssetType === 'logicalFiles' ? (
          <Form.Item
            label="Search File"
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              { required: true, message: 'Required filed' },
              { max: 256, message: 'Maximum of 256 characters allowed' },
            ]}
            required>
            <Row gutter={[8, 0]}>
              <Col style={{ width: 'calc(37.5% - 8px)' }}>
                <AutoComplete
                  options={fileSuggestions}
                  onSelect={handleFileSelect}
                  onSearch={(searchText) => loadFileSuggestions(searchText)}
                  value={selectedFile}
                />
              </Col>
              <Col>
                <Button htmlType="button" block onClick={() => setLogicalFileVisibility(true)} type="primary">
                  Browse
                </Button>
              </Col>
            </Row>
          </Form.Item>
        ) : null}

        {selectedFileDetails && monitoringAssetType === 'logicalFiles' ? (
          <>
            <div style={{ padding: '10px 18px', fontWeight: 'bold', border: '1px solid whitesmoke' }}>File Details</div>
            <div style={{ height: '200px', overflow: 'auto', padding: '10px 18px', border: '1px solid whitesmoke' }}>
              <ObjectKeyValue obj={selectedFileDetails} />
            </div>
          </>
        ) : null}
      </Form>
    </>
  );
}

export default FileMonitoringBasicTab;
