import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import { Button, Form, Input, message, Popconfirm, Icon, Tooltip, Modal, Select } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { useSelector } from "react-redux";
import ReactMarkdown from 'react-markdown'

const { Option, OptGroup } = Select;  

function AddDataflow({action, actionType, isShowing, toggle, applicationId, onDataFlowUpdated, selectedDataflow, dataflows}) {
  const assetReducer = useSelector(state => state.assetReducer);
  const [dataFlow, setDataFlow] = useState({
		id: '',
		title: '',
		description: '',
    clusterId: ''
	});
  const [form, setForm] = useState({
    submitted: false,
    confirmLoading: false
  });
  const [whitelistedClusters, setWhitelistedClusters] = useState([]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [formAction, setFormAction] = useState("mm")

  useEffect(() => {
    setDataFlow({...selectedDataflow});
    setClusterSelected(selectedDataflow ? selectedDataflow.clusterId : '')
  }, [selectedDataflow])

  useEffect(() => {
    getClusters();
    if(assetReducer && assetReducer.clusterId != '') {
      setClusterSelected(assetReducer.clusterId);
    }
  }, [selectedDataflow])

  //Get action from props and set to local state
  useEffect(() => {
    console.log("Running this set state <<<<<<<<<<< ", actionType )
    setFormAction("cow")
  }, [])

  const formItemLayout = 
    action !== "view" ? {
    labelCol: {
      xs: { span: 2 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 4 },
      sm: { span: 24 },
    }
  } : 
  {
          // labelCol: { span: 4 },
          wrapperCol: { span: 14 },
  }
   

  const [formObj] = Form.useForm();

  const getClusters = () => {
    fetch("/api/hpcc/read/getClusters", {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      setWhitelistedClusters(data);
    })
    .catch(error => {
      console.log(error);
    });
  }

  const onClusterSelection= (value) => {
    setClusterSelected(value);
  }

  const handleAddAppOk = () => {
    console.log('handleAddAppOk')
    setForm({
      submitted: true
    });

    let dataflowExistsWithSameName = (dataflows.filter(existingDataflow => existingDataflow.title === dataFlow.title && existingDataflow.id !== dataFlow.id).length > 0);
    if(dataflowExistsWithSameName) {
      message.error("A dataflow exists with the same name. Please select a different name")
      return true;
    }

    if(dataFlow.title == '' || clusterSelected == '') {
      return false;
    }

    setForm({
      confirmLoading: true,
      submitted: true
    });

    fetch('/api/dataflow/save', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify(
      	{	"id": dataFlow.id,
      		"application_id": applicationId,
      		"title": dataFlow.title,
      		"description": dataFlow.description,
          "clusterId": clusterSelected
      	})
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      setForm({
	      confirmLoading: false,
	      submitted: false
	    });

	    toggle();
			clearForm();

	    onDataFlowUpdated();
    }).catch(error => {
      console.log(error);
    });
  }

  const handleAddAppCancel = () => {
  	toggle();
  }

  const openAddDataflowDlg = () => {
  	clearForm();
		toggle();
    actionType("addNew")
  }

  const clearForm = () => {
  	setDataFlow({
  		id:'',
  		title:'',
  		description:''
  	})
  }

  const splCharacters = /[ `!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?~]/;

	return (
	  <React.Fragment>
	  <span style={{ marginLeft: "auto", paddingTop:"5px"}}>
	    <Tooltip placement="bottom" title={"Click to add a new file"}>
	      <Button className="btn btn-secondary btn-sm" onClick={() => openAddDataflowDlg()}><i className="fa fa-plus"></i>Add</Button>
	    </Tooltip>
	  </span>
	  <div>
      <Modal
          title={action === "addNew" ? "Add Dataflow" : "Edit Dataflow"}
          onOk={handleAddAppOk}
          onCancel={handleAddAppCancel}
          visible={isShowing}
          confirmLoading={form.confirmLoading}
          destroyOnClose={true}
        >
	        <Form 
          layout={action === "view" ? "horizontal" : "vertical"} 
          form={formObj} onFinish={handleAddAppOk}>
	            <div className={'form-group' + (form.submitted && !dataFlow.title ? ' has-error' : '')}>
		            <Form.Item  label="Title" {...formItemLayout}
                  rules={[{
                      required: true,
                      // pattern: new RegExp(/^[a-zA-Z0-9_-]*$/),
                      message: "Please enter a valid Title",
                    }
                  ]}
                >
							    <Input 
                    id="title" name="title" 
                    onChange={e => setDataFlow({...dataFlow, [e.target.name]: e.target.value})} 
                    placeholder="Title" 
                    value={dataFlow.title} 
                    onPressEnter={handleAddAppOk}
                    className={action === "view" ? "read-only-input" : ""}
                  />

		          </Form.Item>
	            </div>
	            <Form.Item label="Description" {...formItemLayout}>
                {action === "view" ? <div> <ReactMarkdown className="read-only-markdown"children={dataFlow.description} /> </div> :
                <MarkdownEditor 
                  id="description" 
                  name="description" 
                  targetDomId="dataflowDescr" 
                  onChange={e => setDataFlow({...dataFlow, [e.target.name]: e.target.value})} 
                  value={dataFlow.description}
                  />}

	            </Form.Item>
              <Form.Item {...formItemLayout} label="Cluster">
                {action === "view" ? <span> {whitelistedClusters.map(item =>{if( item.id === clusterSelected){return item.name;}} )} </span> : 
                <Select placeholder="Select a Cluster" onChange={onClusterSelection} style={{ width: 290 }} value={clusterSelected}>
                  {whitelistedClusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                </Select>
              }
                {form.submitted && clusterSelected == '' &&
                  <div className="error">Cluster is required</div>
                }
              </Form.Item>
            </Form>
        </Modal>
     </div>
     </React.Fragment>
	  )

}

export default AddDataflow