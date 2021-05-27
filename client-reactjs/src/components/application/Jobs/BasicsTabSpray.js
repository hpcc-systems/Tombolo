import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Form, Input, Checkbox, Button, Space, Select, Table, AutoComplete, Spin, message, Row, Col } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { SearchOutlined } from '@ant-design/icons';
const { Option, OptGroup } = Select;  

function BasicsTabSpray({enableEdit, editingAllowed, jobType, sprayFileName, style, clearState, clusterId, onChange, clusters}) {
  const [jobSearchErrorShown, setJobSearchErrorShown] = useState(false);
  const [searchResultsLoaded, setSearchResultsLoaded] = useState(false);
  const [dropZoneFileSearchSuggestions, setDropZoneFileSearchSuggestions] = useState([]);
  const [dropZones, setDropZones] = useState([]);
  const [selectedDropZoneName, setSelectedDropZoneName] = useState('');
  const [sprayedFileScope, setSprayedFileScope] = useState('');
  
  
  useEffect(() => {
    getDropZones(clusterId)
  }, [clusterId])

  const onDropZoneFileChange = (value) => {
    //this.setState({...this.state, job: {...this.state.job, sprayFileName: value }}, () => console.log(this.state.job.sprayFileName));
  }

  const getDropZones = (clusterId) => {
    console.log("getDropZones....")
    if(clusterId) {
      fetch("/api/hpcc/read/getDropZones?clusterId="+clusterId, {
        headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      }).then(dropZones => {
        console.log(dropZones)
        this.setState({
          dropZones: dropZones
        });
      })
    }
  }

  const searchDropZoneFiles = (searchString) => {
    if(searchString.length <= 3 || this.state.jobSearchErrorShown) {
      return;
    }
    setJobSearchErrorShown(false);
    setSearchResultsLoaded(false);

    var data = JSON.stringify({
      clusterId: this.state.selectedCluster, 
      dropZoneName: this.state.selectedDropZoneName,
      nameFilter: searchString, 
      server:this.formRef.current.getFieldValue('sprayDropZone').label[0]
    });
    fetch("/api/hpcc/read/dropZoneFileSearch", {
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
      setDropZoneFileSearchSuggestions(suggestions)
      setSearchResultsLoaded(true)
    }).catch(error => {
      if(!jobSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error("There was an error searching the files from cluster");
        });
        setJobSearchErrorShown(true)
      }
    });
  }

  const onDropZoneChange = (e) => {
    console.log(e);
    this.setState({
      selectedDropZoneName:e.value
    });
  }


  return (
    <React.Fragment>
      {jobType == 'Spray' ? 
      <Form.Item label="Dropzone" name="sprayDropZone" >
          {enableEdit ? 
          <Select placeholder="Drop Zone" labelInValue style={{ width: 190 }} defaultValue={selectedDropZoneName} onChange={onDropZoneChange} disabled={!editingAllowed}>
              {Object.keys(dropZones).map(d => <OptGroup label={d}><Option value={d} key={dropZones[d]}>{dropZones[d]}</Option></OptGroup>) }
          </Select>
          :
          <textarea className="read-only-textarea" />
          }
      </Form.Item> : null 
      }
      {jobType == 'Spray' ? 
      <Form.Item label="File" name="sprayFileName">
          {enableEdit ? 
          <Row type="flex">
            <Col span={21} order={1}>
            <Select
            showSearch
            value={sprayFileName}
            placeholder="Search dropzone files..."
            style={style}
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={false}
            onSearch={this.searchDropZoneFiles}
            onChange={this.onDropZoneFileChange}
            notFoundContent={searchResultsLoaded ? 'Not Found' : <Spin />}
            >
            {dropZoneFileSearchSuggestions.map((suggestion) => (
                <Option key={suggestion.name} value={suggestion.name}>
                  {suggestion.name}
                </Option>
                ))}
            </Select>                        
            </Col>
            <Col span={3} order={2} style={{"paddingLeft": "3px"}}>
            <Button htmlType="button" onClick={clearState}>
                Clear
            </Button>
            </Col>
          </Row>
          : <textarea className="read-only-textarea" />}
      </Form.Item> 
      : null}

      {jobType == 'Spray' ? 
      <Form.Item label="Scope" name="sprayedFileScope" >
        {enableEdit ? 
          <Input id="sprayedFileScope"
          onChange={this.onChange}
          placeholder="Scope"
          value={sprayedFileScope}
          disabled={!editingAllowed}
          />
        :
        <textarea className="read-only-textarea" />
        }
      </Form.Item> : null 
      }
  </React.Fragment>
  )
}

export default BasicsTabSpray