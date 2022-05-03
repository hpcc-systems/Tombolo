import React, { useState, useEffect } from 'react';
import { Form, Tabs, Select, Input, message, Table, Button, AutoComplete, Space, Radio} from 'antd';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { useHistory } from 'react-router-dom';
import ReactMarkdown from "react-markdown";

//Local Imports
import { MarkdownEditor } from '../../common/MarkdownEditor.js';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import FileTemplateTable from './FileTemplate_filesTab';
import FileTemplateLayout from './FileTemplate_layoutTab.jsx';
import FileTemplate_permissablePurpose from './FileTemplate_permissablePurpose'
import { hasEditPermission } from '../../common/AuthUtil.js'; 
import DeleteAsset from "../../common/DeleteAsset/index.js";
import LandingZoneFileExplorer from "../../common/LandingZoneFileExplorer"

//Local variables
const { Option } = Select;
const TabPane = Tabs.TabPane;
const fileNameOptions = [
  { name: 'Contains', value: 'contains' },
  { name: 'Starts with', value: 'startsWith' },
  { name: 'Ends with', value: 'endsWith' },
];

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

function FileTemplate(props) {
  const { clusters, application } = useSelector((state) => state.applicationReducer);
  const { selectedAsset } = useSelector((state) => state.assetReducer);
  const groupsReducer = useSelector((state) => state.groupsReducer);
  const {user} = useSelector((state)=> state.authenticationReducer)

  const [files, setFiles] = useState([]);
  const [layoutData, setLayoutData] = useState([]);
  // const [searchingFile, setSearchingFile] = useState(false);
  const [sampleFileForLayout, setSampleFileForLayout] = useState(null)
  const [enableEdit, setEnableEdit] = useState(false);
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [landingZoneMonitoringDetails, setMonitoringDetails] =useState({fileMonitoring: false, landingZonePath: ''})

  const [form] = Form.useForm();
  const history = useHistory();
  const editingAllowed = hasEditPermission(user);

  //Use Effect
  useEffect(() => {
    if(props.displayingInModal){
      setEnableEdit(false)
    }
    const getInitialData = async() =>{
      try{
        await getFileTemplate();
        const files = await getFiles();
        setFiles(files)
      }catch(err){
        console.log(err)
      }  
    }
    if(selectedAsset.isNew && !props.displayingInModal){
      setEnableEdit(true)
    }else{
      getInitialData();
    }      
  }, [application]);

  //search files that matches the pattern and keyword
  const getFiles = () => {
    const {fileNamePattern } = form.getFieldsValue();
    const cluster = form.getFieldValue('cluster') || selectedCluster;
    const searchString = form.getFieldValue('searchString') || searchString;

    const searchData = JSON.stringify({
      clusterid: cluster,
      keyword: searchString,
      fileNamePattern,
    });

   return fetch('/api/hpcc/read/filesearch', {
      method: 'post',
      headers: authHeader(),
      body: searchData,
    })
      .then((response) => {
        if (!response.ok) {
          throw Error('Error while searching file');
        }
        return response.json();
      })

  };

  //Handle change in file search string
  const handleSearch = debounce(() =>{
    const { cluster, searchString, fileNamePattern} = form.getFieldsValue();
    form.setFieldsValue({fileTemplatePattern : `${capitalizeString(fileNamePattern.split(/(?=[A-Z])/).join(' '))}  ${searchString}`});

    if(!cluster){
      message.info('Please select a cluster');
      return;
    }
    if (searchString?.length < 3) {
      return;
    }
       getFiles()
       .then((data) => {
        setFiles(data);
        if(data.length > 0){
          fetchFileLayout(data[data.length-1].value) // Getting file layout form the last file in the array
          setSampleFileForLayout(data[data.length-1].value)
        } 
      })
      .catch((err) => {
        setFiles([]);
        message.error( err.message);
      });
  },500);


  //When cluster dropdown or file drop down changes  - get files again
  const onDropDownValueChange = () => {
    const { cluster, searchString, fileNamePattern, setFileMonitoring } = form.getFieldsValue();
    if(selectedCluster !== cluster){
      setSelectedCluster(cluster)
    }
    if (cluster && searchString && fileNamePattern) {
      getFiles()
       .then((data) => {
        setFiles(data);
        // setSearchingFile(true);
        form.setFieldsValue({sampleFile : ''})
      })
      .catch((err) => {
        setFiles([]);
        message.error(err.message);
      });
      return;
    }
  };

  // When set file monitoring  radio is changed
  const handleFileMonitoringRadioChange = async () =>{
    const {setFileMonitoring, cluster} = form.getFieldsValue();
    if(!cluster && setFileMonitoring){ message.info('please select cluster first'); form.setFieldsValue({setFileMonitoring: false}); return;}
    setMonitoringDetails((prev) =>({...prev, fileMonitoring : setFileMonitoring }))
  }

  //Set root path to landingZone
  const setLandingZoneRootPath = ({landingZonePath}) =>{
    setMonitoringDetails(prev =>({...prev, landingZonePath}))
  }

  //Save file template
  const saveFileTemplate = async () => {
    form.validateFields();
    const {title, cluster, fileNamePattern, searchString, description, setFileMonitoring, landingZone, machine, dirToMonitor, shouldMonitorSubDirs } = form.getFieldsValue();
    const url = `/api/fileTemplate/read/saveFileTemplate`
    const body = JSON.stringify({
          application_id: application?.applicationId,
          cluster,
          title,
          fileNamePattern,
          searchString,
          sampleLayoutFile: sampleFileForLayout,
          description,
          fileLayoutData :  layoutData,
          licenses : selectedLicenses,
          selectedAsset,
          groupId: groupsReducer.selectedKeys.id,
          metaData : {isAssociated : true, fileMonitoringTemplate : setFileMonitoring, landingZone , machine, lzPath: landingZoneMonitoringDetails.landingZonePath, directory : dirToMonitor, monitorSubDirs : shouldMonitorSubDirs }});
    try{
      const response = await fetch(url, {headers: authHeader(), method : 'POST', body });
      if(!response.ok) throw Error ('Unable to save template');
      message.success('Template Saved')
      if (props.history) {
        return props.history.push(`/${application.applicationId}/assets`);
      }else{
        props.onClose();
      }
    }catch(err){
      message.error(err.message)
    }
  };

  // Delete file template 
  const deleteFileTemplate = () =>{
     fetch('/api/fileTemplate/read/deleteFileTemplate', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        id: selectedAsset.id,
        application_id : application.applicationId
      }),
    })
    .then((response) =>{
      if(!response.ok){
        throw Error('Unable to delete file template')
      }
      message.success('File template deleted successfully');
      setTimeout(() => {
        history.push(`/${application.applicationId}/assets`);
      }, 400);
    })
    .catch((err) =>{
      message.error(err.message)
    })
  }
  // Get file Template
  const getFileTemplate = () => {
    return fetch('/api/fileTemplate/read/getFileTemplate', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        id: selectedAsset.id || props.selectedAsset.id,
        application_id: application.applicationId 
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error('Unable to fetch file template details');
        }
        return response.json();
      })
      .then((data) => {
        const {fileMonitoringTemplate, machine, monitorSubDirs, landingZone, directory} = data.metaData;
        setSampleFileForLayout(data.sampleLayout)
        if(fileMonitoringTemplate) {setMonitoringDetails(prev => ({...prev, fileMonitoring : fileMonitoringTemplate}))}
        form.setFieldsValue({
         title: data.title,
         description: data.description,
         searchString: data.searchString,
         fileNamePattern: data.fileNamePattern,
         cluster: data.cluster_id,
         sampleFile: data.sampleLayoutFile,
         clusterName : (clusters[clusters.findIndex(cluster => cluster.id === data.cluster_id)].name),
         fileTemplatePattern : `${capitalizeString(data.fileNamePattern.split(/(?=[A-Z])/).join(' '))}  ${data.searchString}`, 
         setFileMonitoring : data.metaData.fileMonitoringTemplate,
         landingZone : landingZone,
         machine : machine,
         dirToMonitor : directory,
         shouldMonitorSubDirs : monitorSubDirs,
         monitoring : data.monitoring
        });
        setLayoutData(data.fileTemplateLayout?.fields?.layout || []);
        setSelectedCluster(data.cluster_id);
      })
      .catch((err) => {
        console.log(err);
        message.error('Unable to fetch file template details');
      });
  };

  // Fetch sample file layout
  const fetchFileLayout = (file) => {
    const { cluster } = form.getFieldsValue();

    if(!cluster){
      message.info('Please select a cluster');
      return;
    }

    fetch('/api/hpcc/read/getFileInfo?fileName=' + file + '&clusterid=' + cluster + '&applicationId=' + application.applicationId, {
      headers: authHeader(),
    }).then(response =>{
      if(!response.ok){
        throw Error('Unable to fetch sample file layout')
      }
      return response.json();
    }).then(data =>{
      setLayoutData(data.file_layouts)
    }).catch(err =>{
      console.log(err.message)
    })
  };

  //Handle cancel btn click
  const handleCancel = () =>{
    if(props.displayingInModal){
      props.onClose()
    }else{
      history.push(`/${application.applicationId}/assets`)
    }
  }

  //Control Buttons
  const controls = (
    editingAllowed ? 
    <div className={props.displayingInModal ? 'assetDetail-buttons-wrapper-modal' : 'assetDetail-buttons-wrapper '} style={{marginBottom: '10px'}} >
      <div style={{display: "inline-block", marginRight: '15px'}}>
      <Space>
        {enableEdit ?  
        <Button type='primary' ghost onClick={() => setEnableEdit(false)}>
          View Changes
        </Button> :null}
      </Space>
      </div>
      <Space>
        {!enableEdit ?
        <Button type= 'primary' onClick={() => setEnableEdit(true)}>
          Edit
        </Button> : null}

        <Button onClick={handleCancel}>
          Cancel
        </Button>
        {enableEdit ?
        <Button type="primary" onClick={saveFileTemplate}>
          Save
        </Button> :  null}
        {enableEdit && !selectedAsset.isNew?
        <DeleteAsset
                  asset={{
                    id: selectedAsset.id || props.selectedAsset.id,
                    type: 'FileTemplate',
                    title: form.getFieldValue('title'),
                  }}
                  style={{ display: 'inline-block' }}
                  onDelete={deleteFileTemplate}
                  component={ <Button key="danger" type="danger"> Delete </Button> }
                />
        : null}
       </Space>
      </div> : null
  );
  
  // Change form layout based on where it is rendered
  const formItemLayout = 
   props.displayingInModal ? {
    labelCol: { span: 4 },
    wrapperCol: { span: 13 },
   } : 
   {
    wrapperCol : {span: 8},
    labelCol : {span : 2}
  }


  //JSX
  return (
    <React.Fragment>
      <div className={props.displayingInModal ? 'assetDetails-content-wrapper-modal' : 'assetDetails-content-wrapper'} >
        <Tabs defaultActiveKey="1" tabBarExtraContent={props.displayingInModal ? null : controls}>
          <TabPane tab="Basic" key="1">
            <Form {...formItemLayout} labelWrap labelAlign="left" form={form} colon = {false} initialValues={{ fileNamePattern: 'contains', setFileMonitoring : landingZoneMonitoringDetails.fileMonitoring, shouldMonitorSubDirs : true }}>
              <Form.Item
                label="Title"
                name="title"
                className={!enableEdit ? "read-only-input" : ""}
                rules={[
                  { required: enableEdit ? true : false,
                     message: 'Please enter a title!' },
                  {
                    pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                    message: 'Please enter a valid title. Title can have  a-zA-Z0-9:._- and space',
                  },
                ]}
              >
                <Input id="file_title" name="title" placeholder="Title" />
              </Form.Item>

            {!enableEdit && form.getFieldValue('searchString')?
           <Form.Item
            label='File Template Pattern'
            name='fileTemplatePattern'
            defaultValue='22'
            className='read-only-input'>
              <Input placeholder='No file pattern provided'/>
           </Form.Item> : null}

            {enableEdit ?
              <Form.Item
                label="Cluster"
                name="cluster"
                rules={[
                  {
                    required: true,
                    message: 'Please select a cluster!',
                  },
                ]}
              >
                <Select placeholder="Select a Cluster" style={{ width: '50%' }} onChange={onDropDownValueChange}>
                  {clusters.map((cluster) => (
                    <Option key={cluster.id}>{cluster.name}</Option>
                  ))}
                </Select> 
              </Form.Item> 
              :
               <Form.Item
                label="Cluster"
                name="clusterName"
              >
                <Input className='read-only-input'></Input>
              </Form.Item>
            }

            {form.getFieldValue('monitoring') ? 
            <Form.Item label="Monitor" name="monitoring"> 
                  <Radio.Group onChange={handleFileMonitoringRadioChange} disabled>
                  <Radio value={true}> Yes </Radio>
                </Radio.Group>
            </Form.Item> : null}

            <Form.Item label="Type" name="setFileMonitoring" required = {enableEdit} > 
                 <Radio.Group onChange={handleFileMonitoringRadioChange} disabled={!enableEdit}>
                  <Radio value={false}>None</Radio>
                  <Radio value={'landingZone'}>Landing zone files</Radio>
                  <Radio value={'LogicalFiles'} disabled>Logical files</Radio>
                </Radio.Group>
            </Form.Item>

            {landingZoneMonitoringDetails.fileMonitoring ? 
            <LandingZoneFileExplorer 
              clusterId = {form.getFieldValue('cluster')}
              DirectoryOnly = {true}
              setLandingZoneRootPath={setLandingZoneRootPath}
              enableEdit={enableEdit}
            /> : null}

              {landingZoneMonitoringDetails.fileMonitoring ? 
              <Form.Item label='Monitor Sub-dirs'  name="shouldMonitorSubDirs" required ={enableEdit}>
                  <Radio.Group onChange={handleFileMonitoringRadioChange} disabled={!enableEdit}>
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                </Radio.Group>
              </Form.Item> : null}

              {enableEdit ?
              <Form.Item label="File Template" required >
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
                    ]}
                  >
                    <Input onChange={handleSearch}></Input>
                  </Form.Item>
                </Input.Group>
              </Form.Item> : null}

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

              <Form.Item label="Description" name="description" className="markdown-editor">
                {enableEdit ?
                  <MarkdownEditor id="file_desc" name="description" targetDomId="fileDescr" /> :
                  <div className="read-only-markdown">
                        <ReactMarkdown source={form.getFieldValue('description')}/>
                   </div>
                }
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane  key="3" tab= "Layout" >
            <FileTemplateLayout  
              layoutData={layoutData} 
              setLayoutData={setLayoutData}
              enableEdit={enableEdit}
              editingAllowed={editingAllowed}
            />
            
          </TabPane>
          <TabPane tab="Permissable Purpose" key="4">
            <FileTemplate_permissablePurpose
              enableEdit={enableEdit}
              editingAllowed={editingAllowed}
              setSelectedLicenses={setSelectedLicenses}
              selectedLicenses = {selectedLicenses}
              selectedAsset={selectedAsset}
             />
          </TabPane>
          <TabPane tab="Validation Rules" key="5">
            <Table />
          </TabPane>
          <TabPane
            key="6"
            tab={
              <>
                <span> Files </span>
              </>
            }
          >
            <FileTemplateTable data={files} />
          </TabPane>
        </Tabs>
      </div>
      <div style={{marginTop: '15px'}}>
        {props.displayingInModal  ? controls : null}
      </div>
     
    </React.Fragment>
  );
}

export default FileTemplate;