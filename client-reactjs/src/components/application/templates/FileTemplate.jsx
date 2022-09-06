import React, { useState, useEffect } from 'react';
import { Form, Tabs, Select, Input, message, Table, Button, Space, Radio } from 'antd';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { useHistory } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

//Local Imports
import MonacoEditor from '../../common/MonacoEditor.js';
import { authHeader } from '../../common/AuthHeader.js';
import FileTemplateTable from './FileTemplate_filesTab';
import FileTemplateLayout from './FileTemplate_layoutTab.jsx';
import FileTemplatePermissablePurpose from './FileTemplate_permissablePurpose';
import { hasEditPermission } from '../../common/AuthUtil.js';
import DeleteAsset from '../../common/DeleteAsset/index.js';
import LandingZoneFileExplorer from '../../common/LandingZoneFileExplorer';

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
  const { clusters, application, groupId, user } = useSelector((state) => ({
    groupId: state.groupsReducer?.selectedKeys?.id,
    user: state.authenticationReducer.user,
    clusters: state.applicationReducer.clusters,
    application: state.applicationReducer.application,
  }));

  /*Asset can be passed from graph (selectedAsset prop), via asset table (params), and when link was shared (params).
  in order to get info about asset we will take its id from params if selected asset is no available and send request to populate fields. 
  if asset id is 'undefined' it means that we are creating new asset. if asset id is wrong, we will show errors that we cant find asset with that id
  */
  const applicationId = application?.applicationId || match?.params?.applicationId;
  const assetId = selectedAsset?.id || match?.params?.assetId;
  const { t } = useTranslation(['common']);

  const TabPane = Tabs.TabPane;
  const fileNameOptions = [
    { name: t('Contains', { ns: 'common' }), value: 'contains' },
    { name: t('Starts with', { ns: 'common' }), value: 'startsWith' },
    { name: t('Ends with', { ns: 'common' }), value: 'endsWith' },
    { name: t('Wildcards', { ns: 'common' }), value: 'wildCards' },
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
      licenses: selectedLicenses,
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
        const { fileMonitoringTemplate, machine, monitorSubDirs, landingZone, directory } = data.metaData;
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
        setLayoutData(data.file_layouts);
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
              {t('View Changes', { ns: 'common' })}
            </Button>
          ) : null}
        </Space>
      </div>
      <Space>
        {!enableEdit ? (
          <Button type="primary" onClick={() => setEnableEdit(true)}>
            {t('Edit', { ns: 'common' })}
          </Button>
        ) : null}

        <Button onClick={handleCancel}>{t('Cancel', { ns: 'common' })}</Button>
        {enableEdit ? (
          <Button type="primary" onClick={saveFileTemplate}>
            {t('Save', { ns: 'common' })}
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
                {t('Delete', { ns: 'common' })}
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
        <Tabs defaultActiveKey="1" tabBarExtraContent={displayingInModal ? null : controls}>
          <TabPane tab={t('Basic', { ns: 'common' })} key="1">
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
                label={t('Title', { ns: 'common' })}
                name="title"
                className={!enableEdit ? 'read-only-input' : ''}
                rules={[
                  { required: enableEdit ? true : false, message: 'Please enter a title!' },
                  {
                    pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                    message: 'Please enter a valid title. Title can have  a-zA-Z0-9:._- and space',
                  },
                ]}>
                <Input id="file_title" name="title" />
              </Form.Item>

              {!enableEdit && form.getFieldValue('searchString') ? (
                <Form.Item
                  label={t('File Template Pattern', { ns: 'common' })}
                  name="fileTemplatePattern"
                  defaultValue="22"
                  className="read-only-input">
                  <Input placeholder={t('No file pattern provided', { ns: 'common' })} />
                </Form.Item>
              ) : null}

              {enableEdit ? (
                <Form.Item
                  label={t('Cluster', { ns: 'common' })}
                  name="cluster"
                  rules={[
                    {
                      required: true,
                      message: t('Please select a cluster!', { ns: 'common' }),
                    },
                  ]}>
                  <Select style={{ width: '50%' }} onChange={onDropDownValueChange}>
                    {clusters.map((cluster) => (
                      <Option key={cluster.id}>{cluster.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item label={t('Cluster', { ns: 'common' })} name="clusterName">
                  <Input className="read-only-input"></Input>
                </Form.Item>
              )}

              {form.getFieldValue('monitoring') ? (
                <Form.Item label={t('Monitor', { ns: 'common' })} name="monitoring">
                  <Radio.Group onChange={handleFileMonitoringRadioChange} disabled>
                    <Radio value={true}> {t('Yes', { ns: 'common' })} </Radio>
                  </Radio.Group>
                </Form.Item>
              ) : null}

              <Form.Item label={t('Type', { ns: 'common' })} name="setFileMonitoring" required={enableEdit}>
                <Radio.Group onChange={handleFileMonitoringRadioChange} disabled={!enableEdit}>
                  {/* <Radio value={false}>None</Radio> */}
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
                <Form.Item
                  label={t('Monitor Sub-dirs', { ns: 'common' })}
                  name="shouldMonitorSubDirs"
                  required={enableEdit}>
                  <Radio.Group onChange={handleFileMonitoringRadioChange} disabled={!enableEdit}>
                    <Radio value={true}>{t('Yes', { ns: 'common' })}</Radio>
                    <Radio value={false}>{t('No', { ns: 'common' })}</Radio>
                  </Radio.Group>
                </Form.Item>
              ) : null}

              {enableEdit ? (
                <Form.Item label={t('File Template', { ns: 'common' })} required>
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
                      rules={[
                        {
                          required: true,
                          message: 'Please enter search text!',
                        },
                      ]}>
                      <Input onChange={handleSearch}></Input>
                    </Form.Item>
                  </Input.Group>
                </Form.Item>
              ) : null}

              {/* <Form.Item name="sampleFile" label="Sample Layout"  rules={[
                  { required: enableEdit ? true : false, message: 'Please enter a title!' },
                ]}>
                {enableEdit ?
                <AutoComplete
                  style={{ width: '100%' }}
                  options={files}
                  onSelect={fetchFileLayout}
                  placeholder="Search sample file"
                  open={searchingFile}
                  onFocus={() => setSearchingFile(true)}
                  onBlur={() => setSearchingFile(false)}
                  notFoundContent={'Not Files Found'}
                />:
                <Input className={!enableEdit ? "read-only-input" : ""} />}
              </Form.Item> */}

              <Form.Item label={t('Description', { ns: 'common' })} name="description" className="markdown-editor">
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
          <TabPane key="3" tab={t('Layout', { ns: 'common' })}>
            <FileTemplateLayout
              layoutData={layoutData}
              setLayoutData={setLayoutData}
              enableEdit={enableEdit}
              editingAllowed={editingAllowed}
            />
          </TabPane>
          <TabPane tab={t('Permissable Purpose', { ns: 'common' })} key="4">
            <FileTemplatePermissablePurpose
              enableEdit={enableEdit}
              editingAllowed={editingAllowed}
              setSelectedLicenses={setSelectedLicenses}
              selectedLicenses={selectedLicenses}
              selectedAsset={{ id: assetId }}
            />
          </TabPane>
          <TabPane tab={t('Validation Rules', { ns: 'common' })} key="5">
            <Table />
          </TabPane>
          <TabPane key="6" tab={t('Files', { ns: 'common' })}>
            <FileTemplateTable data={files} />
          </TabPane>
        </Tabs>
      </div>
      <div style={{ marginTop: '15px' }}>{displayingInModal ? controls : null}</div>
    </React.Fragment>
  );
}

export default FileTemplate;
