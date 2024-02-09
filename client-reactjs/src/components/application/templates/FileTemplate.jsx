import React, { useState, useEffect } from 'react';
import { Form, Tabs, Select, Input, message, Table, Button, Space, Radio } from 'antd';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { useHistory } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

//Local Imports
import MonacoEditor from '../../common/MonacoEditor.js';
import { authHeader } from '../../common/AuthHeader.js';
import FileTemplateTable from './FileTemplate_filesTab';
import FileTemplateLayout from './FileTemplate_layoutTab.jsx';
import FileTemplatePermissablePurpose from './FileTemplate_permissablePurpose';
import { hasEditPermission } from '../../common/AuthUtil.js';
import DeleteAsset from '../../common/DeleteAsset/index.js';
import LandingZoneFileExplorer from '../../common/LandingZoneFileExplorer';
import Text, { i18n } from '../../common/Text';

//Local variables
const { Option } = Select;

//Message config
message.config({
  top: 100,
  duration: 4,
  maxCount: 1,
});

//Lodash can do this -> but package not added already
const capitalizeString = (text) => {
  let lower = text.toLowerCase();
  return text.charAt(0).toUpperCase() + lower.slice(1);
};

function FileTemplate({ match, selectedAsset = {}, displayingInModal, onClose }) {
  const { clusters, application, groupId, user, licenses } = useSelector((state) => ({
    groupId: state.groupsReducer?.selectedKeys?.id,
    user: state.authenticationReducer.user,
    clusters: state.applicationReducer.clusters,
    application: state.applicationReducer.application,
    licenses: state.applicationReducer.licenses,
  }));

  /*Asset can be passed from graph (selectedAsset prop), via asset table (params), and when link was shared (params).
  in order to get info about asset we will take its id from params if selected asset is no available and send request to populate fields. 
  if asset id is 'undefined' it means that we are creating new asset. if asset id is wrong, we will show errors that we cant find asset with that id
  */
  const applicationId = application?.applicationId || match?.params?.applicationId;
  const assetId = selectedAsset?.id || match?.params?.assetId;

  const TabPane = Tabs.TabPane;
  const fileNameOptions = [
    { name: <Text text="Contains" />, value: 'contains' },
    { name: <Text text="Starts with" />, value: 'startsWith' },
    { name: <Text text="Ends with" />, value: 'endsWith' },
    { name: <Text text="Wildcards" />, value: 'wildCards' },
  ];

  const history = useHistory();

  const [files, setFiles] = useState([]);
  const [layoutData, setLayoutData] = useState([]);
  // const [searchingFile, setSearchingFile] = useState(false);
  const [sampleFileForLayout, setSampleFileForLayout] = useState(null);
  const [enableEdit, setEnableEdit] = useState(false);
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [landingZoneMonitoringDetails, setMonitoringDetails] = useState({ fileMonitoring: false, landingZonePath: '' });

  const [form] = Form.useForm();

  const editingAllowed = hasEditPermission(user);

  //Use Effect
  useEffect(() => {
    (async () => {
      if (!assetId) setEnableEdit(true); // if we starting new template enable edit
      if (assetId && applicationId && clusters?.length > 0) {
        try {
          await getFileTemplate({ assetId, applicationId });
        } catch (err) {
          console.log(err);
        }
      }
    })();
  }, [clusters]);

  //search files that matches the pattern and keyword
  const getFiles = (clusterId) => {
    const { fileNamePattern } = form.getFieldsValue();
    const cluster = clusterId || form.getFieldValue('cluster') || selectedCluster;
    const searchString = form.getFieldValue('searchString');

    const searchData = JSON.stringify({
      clusterid: cluster,
      keyword: searchString || '',
      fileNamePattern,
    });

    return fetch('/api/hpcc/read/filesearch', {
      method: 'post',
      headers: authHeader(),
      body: searchData,
    }).then((response) => {
      if (!response.ok) {
        throw Error('Error while searching file');
      }
      return response.json();
    });
  };

  //Handle change in file search string
  const handleSearch = debounce(() => {
    const { cluster, searchString, fileNamePattern } = form.getFieldsValue();
    form.setFieldsValue({
      fileTemplatePattern: `${capitalizeString(fileNamePattern.split(/(?=[A-Z])/).join(' '))}  ${searchString}`,
    });

    if (!cluster) {
      message.info('Please select a cluster');
      return;
    }
    if (searchString?.length < 3) {
      return;
    }
    getFiles(cluster)
      .then((data) => {
        setFiles(data);
        if (data.length > 0) {
          fetchFileLayout(data[data.length - 1].value); // Getting file layout form the last file in the array
          setSampleFileForLayout(data[data.length - 1].value);
        }
      })
      .catch((err) => {
        setFiles([]);
        message.error(err.message);
      });
  }, 500);

  //When cluster dropdown or file drop down changes  - get files again
  const onDropDownValueChange = () => {
    const { cluster, searchString, fileNamePattern } = form.getFieldsValue();
    if (selectedCluster !== cluster) {
      setSelectedCluster(cluster);
    }
    if (cluster && searchString && fileNamePattern) {
      getFiles(cluster)
        .then((data) => {
          setFiles(data);
          // setSearchingFile(true);
          form.setFieldsValue({ sampleFile: '' });
        })
        .catch((err) => {
          setFiles([]);
          message.error(err.message);
        });
      return;
    }
  };

  // When set file monitoring  radio is changed
  const handleFileMonitoringRadioChange = async () => {
    const { setFileMonitoring, cluster } = form.getFieldsValue();
    if (!cluster && setFileMonitoring) {
      message.info('please select cluster first');
      form.setFieldsValue({ setFileMonitoring: false });
      return;
    }
    setMonitoringDetails((prev) => ({ ...prev, fileMonitoring: setFileMonitoring }));
  };

  //Set root path to landingZone
  const setLandingZoneRootPath = ({ landingZonePath }) => {
    setMonitoringDetails((prev) => ({ ...prev, landingZonePath }));
  };

  //Save file template
  const saveFileTemplate = async () => {
    await form.validateFields();
    const {
      title,
      cluster,
      fileNamePattern,
      searchString,
      description,
      setFileMonitoring,
      landingZone,
      machine,
      dirToMonitor,
      shouldMonitorSubDirs,
    } = form.getFieldsValue();
    const url = `/api/fileTemplate/read/saveFileTemplate`;
    const body = JSON.stringify({
      title,
      assetId,
      groupId,
      cluster,
      description,
      searchString,
      fileNamePattern,
      fileLayoutData: layoutData,
      application_id: applicationId,
      sampleLayoutFile: sampleFileForLayout,
      metaData: {
        isAssociated: true,
        fileMonitoringTemplate: setFileMonitoring,
        landingZone,
        machine,
        lzPath: landingZoneMonitoringDetails.landingZonePath,
        directory: dirToMonitor,
        monitorSubDirs: shouldMonitorSubDirs,
        licenses: selectedLicenses,
      },
    });
    try {
      const response = await fetch(url, { headers: authHeader(), method: 'POST', body });
      if (!response.ok) throw Error('Unable to save template');
      message.success('Template Saved');

      if (displayingInModal) {
        const result = await response.json();

        const resultToGraph = {
          name: title,
          title: title,
          assetId: result.assetId,
        };

        onClose(resultToGraph);
      } else {
        history.push(`/${application.applicationId}/assets`);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  // Delete file template
  const deleteFileTemplate = () => {
    fetch('/api/fileTemplate/read/deleteFileTemplate', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        id: assetId,
        application_id: applicationId,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error('Unable to delete file template');
        }
        message.success('File template deleted successfully');
        setTimeout(() => {
          history.push(`/${application.applicationId}/assets`);
        }, 400);
      })
      .catch((err) => {
        message.error(err.message);
      });
  };
  // Get file Template
  const getFileTemplate = ({ assetId, applicationId }) => {
    return fetch('/api/fileTemplate/read/getFileTemplate', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        id: assetId,
        application_id: applicationId,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error('Unable to fetch file template details');
        }
        return response.json();
      })
      .then(async (data) => {
        const { fileMonitoringTemplate, machine, monitorSubDirs, landingZone, directory, licenses } = data.metaData;
        setSampleFileForLayout(data.sampleLayout);
        if (fileMonitoringTemplate) {
          setMonitoringDetails((prev) => ({ ...prev, fileMonitoring: fileMonitoringTemplate }));
        }
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          searchString: data.searchString,
          fileNamePattern: data.fileNamePattern,
          cluster: data.cluster_id,
          sampleFile: data.sampleLayoutFile,
          clusterName: clusters[clusters.findIndex((cluster) => cluster.id === data.cluster_id)].name,
          fileTemplatePattern: `${capitalizeString(data.fileNamePattern.split(/(?=[A-Z])/).join(' '))}  ${
            data.searchString
          }`,
          setFileMonitoring: data.metaData.fileMonitoringTemplate,
          landingZone: landingZone,
          machine: machine,
          dirToMonitor: directory,
          shouldMonitorSubDirs: monitorSubDirs,
          monitoring: data.monitoring,
        });
        setLayoutData(data.fileTemplateLayout?.fields?.layout || []);
        setSelectedLicenses(licenses);
        setSelectedCluster(data.cluster_id);
        const files = await getFiles(data.cluster_id);
        setFiles(files);
      })
      .catch((err) => {
        console.log(err);
        message.error('Unable to fetch file template details');
      });
  };

  // Fetch sample file layout
  const fetchFileLayout = (file) => {
    const { cluster } = form.getFieldsValue();

    if (!cluster) {
      message.info('Please select a cluster');
      return;
    }

    fetch(
      '/api/hpcc/read/getFileInfo?fileName=' +
        file +
        '&clusterid=' +
        cluster +
        '&applicationId=' +
        application.applicationId,
      {
        headers: authHeader(),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw Error('Unable to fetch sample file layout');
        }
        return response.json();
      })
      .then((data) => {
        setLayoutData(data.basic?.metaData?.layout || []);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  //Handle cancel btn click
  const handleCancel = () => {
    if (displayingInModal) {
      onClose();
    } else {
      history.push(`/${application.applicationId}/assets`);
    }
  };

  //Control Buttons
  const controls = editingAllowed ? (
    <div
      className={displayingInModal ? 'assetDetail-buttons-wrapper-modal' : 'assetDetail-buttons-wrapper '}
      style={{ marginBottom: '10px' }}>
      <div style={{ display: 'inline-block', marginRight: '15px' }}>
        <Space>
          {enableEdit ? (
            <Button type="primary" ghost onClick={() => setEnableEdit(false)}>
              {<Text text="View Changes" />}
            </Button>
          ) : null}
        </Space>
      </div>
      <Space>
        {!enableEdit ? (
          <Button type="primary" onClick={() => setEnableEdit(true)}>
            {<Text text="Edit" />}
          </Button>
        ) : null}

        <Button onClick={handleCancel}>{<Text text="Cancel" />}</Button>
        {enableEdit ? (
          <Button type="primary" onClick={saveFileTemplate}>
            {<Text text="Save" />}
          </Button>
        ) : null}
        {enableEdit && assetId ? (
          <DeleteAsset
            asset={{
              id: assetId,
              type: 'FileTemplate',
              title: form.getFieldValue('title'),
            }}
            style={{ display: 'inline-block' }}
            onDelete={deleteFileTemplate}
            component={
              <Button key="danger" type="danger">
                {<Text text="Delete" />}
              </Button>
            }
          />
        ) : null}
      </Space>
    </div>
  ) : null;

  // Change form layout based on where it is rendered
  const formItemLayout = displayingInModal
    ? {
        labelCol: { span: 4 },
        wrapperCol: { span: 13 },
      }
    : {
        wrapperCol: { span: 8 },
        labelCol: { span: 2 },
      };

  //JSX
  return (
    <React.Fragment>
      <div className={displayingInModal ? 'assetDetails-content-wrapper-modal' : 'assetDetails-content-wrapper'}>
        <Tabs type="card" defaultActiveKey="1" tabBarExtraContent={displayingInModal ? null : controls}>
          <TabPane tab={<Text text="Basic" />} key="1">
            <Form
              {...formItemLayout}
              labelWrap
              labelAlign="left"
              form={form}
              colon={false}
              initialValues={{
                fileNamePattern: 'contains',
                setFileMonitoring: landingZoneMonitoringDetails.fileMonitoring,
                shouldMonitorSubDirs: true,
              }}>
              <Form.Item
                label={<Text text="Title" />}
                name="title"
                validateTrigger={['onChange', 'onBlur']}
                className={!enableEdit ? 'read-only-input' : ''}
                rules={[
                  { required: enableEdit ? true : false, message: 'Please enter a title!' },
                  {
                    pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                    message: 'Please enter a valid title. Title can have  a-zA-Z0-9:._- and space',
                  },
                  {
                    max: 256,
                    message: 'Maximum of 256 characters allowed',
                  },
                ]}>
                <Input id="file_title" name="title" />
              </Form.Item>

              {!enableEdit && form.getFieldValue('searchString') ? (
                <Form.Item
                  label={<Text text="File Template Pattern" />}
                  name="fileTemplatePattern"
                  defaultValue="22"
                  className="read-only-input">
                  <Input placeholder={i18n('No file pattern provided')} />
                </Form.Item>
              ) : null}

              {enableEdit ? (
                <Form.Item
                  label={<Text text="Cluster" />}
                  name="cluster"
                  rules={[
                    {
                      required: true,
                      message: <Text text="Please select a cluster!" />,
                    },
                  ]}>
                  <Select style={{ width: '50%' }} onChange={onDropDownValueChange}>
                    {clusters.map((cluster) => (
                      <Option key={cluster.id}>{cluster.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item label={<Text text="Cluster" />} name="clusterName">
                  <Input className="read-only-input"></Input>
                </Form.Item>
              )}

              {form.getFieldValue('monitoring') ? (
                <Form.Item label={<Text text="Monitor" />} name="monitoring">
                  <Radio.Group onChange={handleFileMonitoringRadioChange} disabled>
                    <Radio value={true}> {<Text text="Yes" />} </Radio>
                  </Radio.Group>
                </Form.Item>
              ) : null}

              <Form.Item label={<Text text="Type" />} name="setFileMonitoring" required={enableEdit}>
                <Radio.Group onChange={handleFileMonitoringRadioChange} disabled={!enableEdit}>
                  <Radio value={false}>Logical files</Radio>
                  <Radio value={'landingZone'}>Landing zone files</Radio>
                </Radio.Group>
              </Form.Item>

              {landingZoneMonitoringDetails.fileMonitoring ? (
                <LandingZoneFileExplorer
                  clusterId={form.getFieldValue('cluster')}
                  DirectoryOnly={true}
                  setLandingZoneRootPath={setLandingZoneRootPath}
                  enableEdit={enableEdit}
                />
              ) : null}

              {landingZoneMonitoringDetails.fileMonitoring ? (
                <Form.Item label={<Text text="Monitor Sub-dirs" />} name="shouldMonitorSubDirs" required={enableEdit}>
                  <Radio.Group onChange={handleFileMonitoringRadioChange} disabled={!enableEdit}>
                    <Radio value={true}>{<Text text="Yes" />}</Radio>
                    <Radio value={false}>{<Text text="No" />}</Radio>
                  </Radio.Group>
                </Form.Item>
              ) : null}

              {enableEdit ? (
                <Form.Item label={<Text text="File Template" />} required>
                  <Input.Group compact>
                    <Form.Item name="fileNamePattern" style={{ width: '30%' }}>
                      <Select style={{ width: '100%' }} onChange={onDropDownValueChange}>
                        {fileNameOptions.map((fileName) => (
                          <Option key={fileName.value}>{fileName.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="searchString"
                      style={{ width: '70%' }}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          message: 'Please enter search text!',
                        },
                        {
                          max: 256,
                          message: 'Maximum of 256 characters allowed',
                        },
                      ]}>
                      <Input onChange={handleSearch}></Input>
                    </Form.Item>
                  </Input.Group>
                </Form.Item>
              ) : null}

              <Form.Item label={<Text text="Description" />} name="description" className="markdown-editor">
                {enableEdit ? (
                  <MonacoEditor targetDomId="fileDescr" />
                ) : (
                  <div className="read-only-markdown">
                    <ReactMarkdown source={form.getFieldValue('description')} />
                  </div>
                )}
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane key="3" tab={<Text text="Layout" />}>
            <FileTemplateLayout
              layoutData={layoutData}
              setLayoutData={setLayoutData}
              enableEdit={enableEdit}
              editingAllowed={editingAllowed}
            />
          </TabPane>
          <TabPane tab={<Text text="Permissable Purpose" />} key="4">
            <FileTemplatePermissablePurpose
              enableEdit={enableEdit}
              editingAllowed={editingAllowed}
              setSelectedLicenses={setSelectedLicenses}
              selectedLicenses={selectedLicenses}
              selectedAsset={{ id: assetId }}
              licenses={licenses}
            />
          </TabPane>
          <TabPane tab={<Text text="Validation Rules" />} key="5">
            <Table />
          </TabPane>
          <TabPane key="6" tab={<Text text="Files" />}>
            <FileTemplateTable data={files} />
          </TabPane>
        </Tabs>
      </div>
      <div style={{ marginTop: '15px' }}>{displayingInModal ? controls : null}</div>
    </React.Fragment>
  );
}

export default FileTemplate;
