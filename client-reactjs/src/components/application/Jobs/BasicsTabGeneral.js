import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Form, Input, Checkbox, Button, Space, Select, Table, AutoComplete, Spin, message, Row, Col } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from "react-redux";
import { assetsActions } from '../../../redux/actions/Assets';
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { formItemLayout, threeColformItemLayout } from "../../common/CommonUtil.js";
const { Option, OptGroup } = Select;  


function BasicsTabGeneral({enableEdit, editingAllowed, addingNewAsset, jobType, clearState, onChange, clusters, localState, formRef, applicationId, setJobDetails}) {
  const assetReducer = useSelector(state => state.assetReducer);
  const dataflowReducer = useSelector(state => state.dataflowReducer);
  const [jobSearchErrorShown, setJobSearchErrorShown] = useState(false);
  const [searchResultsLoaded, setSearchResultsLoaded] = useState(false);
  const [jobSearchSuggestions, setJobSearchSuggestions] = useState([]);  
  const [selectedCluster, setSelectedCluster] = useState(assetReducer.clusterId);
  const dispatch = useDispatch();
  

  const searchJobs = (searchString) => {
    if(searchString.length <= 3 || jobSearchErrorShown) {
      return;
    }
    setJobSearchErrorShown(false);
    setSearchResultsLoaded(false);

    var data = JSON.stringify({clusterid: selectedCluster, keyword: searchString, indexSearch:true});
    fetch("/api/hpcc/read/jobsearch", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
      handleError(response);
    })
    .then(suggestions => {
      setSearchResultsLoaded(true);
      setJobSearchSuggestions(suggestions);
    }).catch(error => {
      if(!jobSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error("There was an error searching the job from cluster");
        });
        setJobSearchErrorShown(true);      }
    });
  }

  const onJobSelected = (option) => {
    fetch("/api/hpcc/read/getJobInfo?jobWuid="+option.key+"&jobName="+option.value+"&clusterid="+selectedCluster+"&jobType="+jobType+"&applicationId="+applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(jobInfo => {      
      localState.job = {
        ...localState.job,
        id: jobInfo.id,
        inputFiles: jobInfo.jobfiles.filter(jobFile => jobFile.file_type == 'input'),
        outputFiles: jobInfo.jobfiles.filter(jobFile => jobFile.file_type == 'output'),
        groupId: jobInfo.groupId,
        ecl: jobInfo.ecl

      }
      formRef.current.setFieldsValue({
        name: jobInfo.name,
        title: jobInfo.title,
        description: jobInfo.description,
        gitRepo: jobInfo.gitRepo,
        ecl: jobInfo.ecl,
        entryBWR: jobInfo.entryBWR
      })
      setJobDetails(jobInfo);
      return jobInfo;
    })
    .catch(error => {
      console.log(error);
    });
  }

  const onClusterSelection = (value) => {
    dispatch(assetsActions.clusterSelected(value));
    setSelectedCluster(value);
    localState.selectedCluster = value;
  }


  return (
    
    <React.Fragment>
      {enableEdit ?
        <div>
          {addingNewAsset ?
            <React.Fragment>
              <Form.Item {...formItemLayout} label="Cluster" name="clusters">
                <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={onClusterSelection} style={{ width: 190 }}>
                    {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
              </Form.Item>
              {addingNewAsset && jobType != 'Spray' ?
                <Form.Item label="Job" name="querySearchValue">
                  <Row type="flex">
                    <Col span={21} order={1}>
                      <AutoComplete
                        className="certain-category-search"
                        dropdownClassName="certain-category-search-dropdown"
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{ width: 300 }}
                        style={{ width: '100%' }}
                        onSearch={(value) => searchJobs(value)}
                        onSelect={(value, option) => onJobSelected(option)}
                        placeholder="Search jobs"
                        disabled={!editingAllowed}
                        notFoundContent={searchResultsLoaded ? 'Not Found' : <Spin />}
                      >
                        {jobSearchSuggestions.map((suggestion) => (
                        <Option key={suggestion.value} value={suggestion.text}>
                            {suggestion.wuid}
                        </Option>
                        ))}
                      </AutoComplete>
                    </Col>
                    <Col span={3} order={2} style={{"paddingLeft": "3px"}}>
                      <Button htmlType="button" onClick={clearState}>
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </Form.Item> : null}
          </React.Fragment>
          : null}
        </div> : null }

              <Form.Item label="Name" name="name" 
              rules={[{ required: true, message: 'Please enter a Name!', pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/) }]}>
                <Input
                  id="job_name"
                  onChange={onChange}
                  placeholder="Name"
                  disabled={true}
                  disabled={!editingAllowed}
                  className={enableEdit ? null : "read-only-input"} />
              </Form.Item>
              <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title!' }, {
                pattern: new RegExp(/^[ a-zA-Z0-9:._-]*$/),
                message: 'Please enter a valid Title. Title can have  a-zA-Z0-9:._- and space',
              }]}>
                <Input id="job_title"
                  onChange={onChange}
                  placeholder="Title"
                  disabled={!editingAllowed}
                  className={enableEdit? null : "read-only-input"}
                />
              </Form.Item>
              <Form.Item label="Description" name="description">
              {enableEdit ?
                <MarkdownEditor
                name="description"
                id="job_desc"
                onChange={onChange}
                targetDomId="jobDescr"
                value={localState.description}
                disabled={!editingAllowed}/>
                :
                <div className="read-only-markdown">
                   <ReactMarkdown source={localState.description} />
                   </div>
              }

              </Form.Item>
              {jobType != 'Data Profile' && jobType != 'Spray' ?
              <Form.Item label="Git Repo" name="gitRepo" rules={[{
                  type: 'url',
                  message: 'Please enter a valid url',
              }]}>
                  {enableEdit ?
                  <Input id="job_gitRepo"
                  onChange={onChange}
                  placeholder="Git Repo"
                  value={localState.gitRepo}
                  disabled={!editingAllowed}

                  /> :
                  <textarea className="read-only-textarea" />
                  }
              </Form.Item>
              : null }
              {jobType != 'Spray' ? 
              <React.Fragment>
              <Form.Item label="Entry BWR" name="entryBWR" rules={[{
                  pattern: new RegExp(/^[a-zA-Z0-9:$._]*$/),
                  message: 'Please enter a valid BWR',
              }]}>
                  {enableEdit ?
                  <Input id="job_entryBWR"
                  onChange={onChange}
                  placeholder="Entry BWR"
                  value={localState.entryBWR}
                  disabled={!editingAllowed}
                  /> :
                  <textarea className="read-only-textarea" />
                  }
              </Form.Item>
              <Row type="flex">
                  <Col span={12} order={1}>
                  <Form.Item {...threeColformItemLayout} label="Contact Email" name="contact" rules={[{
                      type: 'email',
                      message: 'Please enter a valid email address',
                  }]}>
                      {enableEdit ?
                      <Input id="job_bkp_svc"
                      onChange={onChange}
                      placeholder="Contact"
                      value={localState.contact}
                      disabled={!editingAllowed}
                      />
                      :
                      <textarea className="read-only-textarea" />
                  }
                  </Form.Item>
                  </Col>
                  <Col span={12} order={2}>
                  <Form.Item label="Author:" name="author" rules={[{
                      pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                      message: 'Please enter a valid author',
                  }]}>
                  {enableEdit ?
                      <Input
                      id="job_author"
                      onChange={onChange}
                      placeholder="Author"
                      value={localState.author}
                      disabled={!editingAllowed}
                      /> :
                      <textarea className="read-only-textarea" />
                  }
                  </Form.Item>
                  </Col>
              </Row> </React.Fragment>: null}                            
    </React.Fragment>                
  )
}

export default BasicsTabGeneral