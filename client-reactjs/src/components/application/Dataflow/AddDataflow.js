import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom';
import { Button, Form, Input, message, Popconfirm, Icon, Tooltip, Modal } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"

function AddDataflow({isShowing, toggle, applicationId, onDataFlowUpdated, selectedDataflow}) {
	const [dataFlow, setDataFlow] = useState({
		id: '',
		title: '',
		description: ''
	});

  const [form, setForm] = useState({
    submitted: false,
    confirmLoading: false
  }); 

  useEffect(() => {
    setDataFlow({...selectedDataflow});
   }, [selectedDataflow])

  const formItemLayout = {
    labelCol: {
      xs: { span: 2 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 2 },
      sm: { span: 10 },
    },
  };

  const handleAddAppOk = () => {
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
      		"description": dataFlow.description
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
  }

  const clearForm = () => {
  	setDataFlow({
  		id:'',
  		title:'',
  		description:''
  	})
  }

	return (
	  <React.Fragment>
	  <span style={{ marginLeft: "auto", paddingTop:"5px"}}>
	    <Tooltip placement="bottom" title={"Click to add a new file"}>
	      <Button className="btn btn-secondary btn-sm" onClick={() => openAddDataflowDlg()}><i className="fa fa-plus"></i>Add Dataflow</Button>
	    </Tooltip>
	  </span>
	  <div>
      <Modal
          title="Add Dataflow"
          onOk={handleAddAppOk.bind(this)}
          onCancel={handleAddAppCancel}
          visible={isShowing}
          confirmLoading={form.confirmLoading}
        >
	        <Form layout="vertical">	            
	            <div className={'form-group' + (form.submitted && !dataFlow.title ? ' has-error' : '')}>
		            <Form.Item {...formItemLayout} label="Title">
							    <Input id="title" name="title" onChange={e => setDataFlow({...dataFlow, [e.target.name]: e.target.value})} placeholder="Title" value={dataFlow.title}/>
			            {form.submitted && !dataFlow.title &&
		                    <div className="help-block">Title is required</div>
			            }
		            </Form.Item>
	            </div>
	            <Form.Item {...formItemLayout} label="Description">
				    		<Input id="description" name="description" onChange={e => setDataFlow({...dataFlow, [e.target.name]: e.target.value})} placeholder="Description" value={dataFlow.description}/>
	            </Form.Item>
            </Form>
        </Modal>
     </div>
     </React.Fragment>
	  )  

}

export default AddDataflow