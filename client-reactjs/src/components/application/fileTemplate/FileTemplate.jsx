import React, { useState, useEffect } from 'react';
import { Form, Tabs, Select, Input, message, Badge, Button, AutoComplete } from 'antd';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { useHistory } from 'react-router-dom';

//Local Imports
import { MarkdownEditor } from '../../common/MarkdownEditor.js';
import { authHeader } from '../../common/AuthHeader.js';
import FileTemplateTable from './FileTemplateTable';
import FileTemplateLayout from './FileTemplateLayout.jsx';

//Local variables
const { Option } = Select;
const TabPane = Tabs.TabPane;
const formItemLayout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 8 },
};
const fileNameOptions = [
  { name: 'Contains', value: 'contains' },
  { name: 'Starts with', value: 'startsWith' },
  { name: 'Ends with', value: 'endsWith' },
];

//Antd message config
message.config({
  top: 100,
  duration: 4,
  maxCount: 1,
});

function FileTemplate() {
  const { clusters, application } = useSelector((state) => state.applicationReducer);
  const { selectedAsset } = useSelector((state) => state.assetReducer);
  const [files, setFiles] = useState([]);
  const [options, setOptions] = useState([]);
  const [layoutData, setLayoutData] = useState([])
  const [form] = Form.useForm();
  const history = useHistory();

  //Use Effect
  useEffect(() => {
    if (selectedAsset.id) {
      console.log(selectedAsset.id);
      getFileTemplate();
      searchFile();
    }
  }, []);

  //search files
  const searchFile = debounce(() => {
    // needs refactoring
    const { cluster, searchString, fileNamePattern } = form.getFieldsValue();
    if (searchString?.length < 3) {
      return;
    }
    if (!cluster) {
      message.info('Please select a cluster');
      return;
    }

    const searchData = JSON.stringify({
      clusterid: cluster,
      keyword: searchString,
      fileNamePattern,
    });

    fetch('/api/hpcc/read/filesearch', {
      method: 'post',
      headers: authHeader(),
      body: searchData,
    })
      .then((response) => {
        console.log(response);
        if (!response.ok) {
          throw Error('Error while searching file');
        }
        return response.json();
      })
      .then((data) => {
        setFiles(data);
        console.log(data);
      })
      .catch((err) => {
        setFiles([]);
        message.error(err.message);
      });
  }, 500);

  //search files
  const searchLayout = debounce((layoutSearchString) => {
    // needs refactoring
    const { cluster } = form.getFieldsValue();
    if (layoutSearchString?.length < 3) {
      return;
    }
    if (!cluster) {
      message.info('Please select a cluster');
      return;
    }

    const searchData = JSON.stringify({
      clusterid: cluster,
      keyword: layoutSearchString,
      fileNamePattern: 'contains',
    });

    fetch('/api/hpcc/read/filesearch', {
      method: 'post',
      headers: authHeader(),
      body: searchData,
    })
      .then((response) => {
        console.log(response);
        if (!response.ok) {
          throw Error('Error while searching file');
        }
        return response.json();
      })
      .then((data) => {
        setOptions(data);
        console.log(data);
      })
      .catch((err) => {
        setFiles([]);
        message.error(err.message);
      });
  }, 500);

  //When cluster dropdown or file drop down changes  - get files again
  const onDropDownValueChange = () => {
    const { cluster, searchString, fileNamePattern } = form.getFieldsValue();
    if (cluster && searchString && fileNamePattern) {
      searchFile();
      console.log(form.getFieldsValue());
    }
  };

  //Save file template
  const saveFileTemplate = () => {
    form.validateFields();
    console.log(
      application?.applicationId,
      form.getFieldValue('cluster'),
      form.getFieldValue('fileNamePattern'),
      form.getFieldValue('searchString'),
      form.getFieldValue('description')
    );

    fetch('/api/fileTemplate/read/saveFileTemplate', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        application_id: application?.applicationId,
        cluster: form.getFieldValue('cluster'),
        title: form.getFieldValue('title'),
        fileNamePattern: form.getFieldValue('fileNamePattern'),
        searchString: form.getFieldValue('searchString'),
        description: form.getFieldValue('description'),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error('Unable to save file template - Try again');
        }
        message.success('File template created');
        setTimeout(() => {
          history.push(`${application.applicationId}/assets`);
        }, 400);
      })
      .catch((err) => {
        message.error(err.message);
      });
  };

  // Get file Template
  const getFileTemplate = () => {
    console.log('Executing Ge file func ');
    fetch('/api/fileTemplate/read/getFileTemplate', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        id: selectedAsset.id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error('Unable to fetch file template details');
        }
        return response.json();
      })
      .then((data) => {
        form.setFieldsValue({
          ['title']: data.title,
          ['description']: data.description,
          ['searchString']: data.searchString,
          ['fileNamePattern']: data.fileNamePattern,
          ['cluster']: data.cluster_id,
        });
      })
      .catch((err) => {
        console.log(err);
        message.error('Unable to fetch file template details');
      });
  };

  // When sample file is selected
  const fetchFileLayout = (file) => {
    console.log('<<<<<<<<<<< Selected file', file);
    const { cluster } = form.getFieldsValue();

    if(!cluster){
      message.info('Please select a cluster')
    }
    fetch('/api/hpcc/read/getFileInfo?fileName=' + file + '&clusterid=' + cluster + '&applicationId=' + application.applicationId, {
      headers: authHeader(),
    }).then(response =>{
      if(!response.ok){
        throw Error('Unable to fetch sample file layout')
      }
      return response.json();
    }).then(data =>{
      console.log('<<< DATA <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      console.log(data.file_layouts, )
      console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      setLayoutData(data.file_layouts)
    }).catch(err =>{
      message.error(err.message)
    })
  };

  //Control Buttons
  const controls = (
    <Button type="primary" onClick={saveFileTemplate}>
      Save
    </Button>
  );

  //JSX
  return (
    <React.Fragment>
      <div className="assetDetails-content-wrapper">
        <Tabs defaultActiveKey="1" tabBarExtraContent={null} tabBarExtraContent={controls}>
          <TabPane tab="Basic" key="1">
            <Form {...formItemLayout} labelAlign="left" form={form} initialValues={{ fileNamePattern: 'contains' }}>
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

              <Form.Item label="File">
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
                    <Input onChange={searchFile}></Input>
                  </Form.Item>
                </Input.Group>
              </Form.Item>

              <Form.Item name="sampleFile" label="Sample Layout">
                <AutoComplete
                  style={{ width: '100%' }}
                  // value={value}
                  options={options}
                  onSelect={fetchFileLayout}
                  onSearch={searchLayout}
                  // onChange={onChange}
                  placeholder="Search sample file"
                />
              </Form.Item>

              <Form.Item
                label="Title"
                name="title"
                rules={[
                  { required: true, message: 'Please enter a title!' },
                  {
                    pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                    message: 'Please enter a valid title. Title can have  a-zA-Z0-9:._- and space',
                  },
                ]}
              >
                <Input id="file_title" name="title" placeholder="Title" />
              </Form.Item>

              <Form.Item label="Description" name="description" className="markdown-editor">
                <MarkdownEditor id="file_desc" name="description" targetDomId="fileDescr" />
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane  key="3"
              tab={
              <>
                <span> Layout </span>
                <Badge
                  count={form.getFieldValue('sampleFile')  ? `${layoutData.length} Rows` : null}
                  style={{ backgroundColor: layoutData.length > 0 ? 'var(--green)' : 'red' }}
                  showZero={layoutData}
                />
              </>
            }
          >
            <FileTemplateLayout  layoutData={layoutData}/>
          </TabPane>
          <TabPane tab="Permissable Purpose" key="4">
            Empty Permissible Purpose Tab
          </TabPane>
          <TabPane tab="Validation Rules" key="5">
            Empty Validation Rules Tab
          </TabPane>
          {console.log(form.getFieldValue('cluster') && form.getFieldValue('searchString') && form.getFieldValue('fileNamePattern'))}
          {console.log(form)}
          <TabPane
            key="6"
            tab={
              <>
                <span> Files </span>
                <Badge
                  count={form.getFieldValue('cluster') && form.getFieldValue('searchString') ? `${files.length} Matching files` : null}
                  style={{ backgroundColor: files.length > 0 ? 'var(--green)' : 'red' }}
                  showZero={form.getFieldValue('cluster') && form.getFieldValue('searchString')}
                />
              </>
            }
          >
            <FileTemplateTable data={files} />
          </TabPane>
        </Tabs>
      </div>
    </React.Fragment>
  );
}

export default FileTemplate;
