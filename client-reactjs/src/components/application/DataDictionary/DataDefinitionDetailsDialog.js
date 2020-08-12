import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom';
import { Modal, Button, Tabs, Select, Form, Typography, Divider, Input, Icon, Table, message } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { useSelector } from "react-redux";
import { hasEditPermission } from "../../common/AuthUtil.js";
import {eclTypes} from '../../common/CommonUtil';
import EditableTable from "../../common/EditableTable.js"
const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { Paragraph } = Typography;

function DataDefinitionDetailsDialog({selectedDataDefinition, applicationId, onDataUpdated}) {
  const [visible, setVisible] = useState(false);
  const [dataDefinition, setDataDefinition] = useState({
    id: '',
    applicationId:'',
    name: '',    
    description: '',
    data_defn: []
  });
  const editableTable = useRef();

  useEffect(() => {
    if(applicationId && selectedDataDefinition != '') {	  
    	getDataDefintionDetails();  	  	
    }
    setVisible(true);
	}, [applicationId, selectedDataDefinition]);

  const onClose = () => {
  	setVisible(false);
  }

  const onSave = () => {
    message.config({top:130})
    let dataToSave = dataDefinition;
    dataToSave.application_id = applicationId;
    dataToSave.data_defn = JSON.stringify(editableTable.current.getData());
    fetch("/api/data-dictionary/save", {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify(dataToSave)
    }).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then(saveResponse => {
      setVisible(false);
      onDataUpdated();
      message.success("Data Defintion saved successfully.")
    }).catch(error => {
      message.error(error);
    });
  }

  const getDataDefintionDetails = async () => {  
    fetch('/api/data-dictionary?application_id='+applicationId+'&id='+selectedDataDefinition, {
      headers: authHeader()
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      console.log(data)
      setDataDefinition(...data); 
      console.log(dataDefinition)
      
    }).catch(error => {
      console.log(error);
    });
  };    

  const onChange = (e) => {	
  	const {name, value} = e.target
    setDataDefinition({...dataDefinition, [name]: value})
  }

  const formItemLayout = {
    labelCol: {
      xs: { span: 4 },
      sm: { span: 3 },
    },
    wrapperCol: {
      xs: { span: 2 },
      sm: { span: 10 },
    },
  };

  const authReducer = useSelector(state => state.authenticationReducer);
  const editingAllowed = hasEditPermission(authReducer.user);

  const layoutColumns = [    
    {
      title: 'Name',
      dataIndex: 'name',
      sort: "asc",
      editable: true
    },
    {
      title: 'Type',
      dataIndex: 'data_type',
      editable: true,
      celleditor: "select",
      celleditorparams: {
        values: eclTypes.sort()
      }
    }
  ]

  const dataSource = (dataDefinition.data_defn && dataDefinition.data_defn.length) > 0 ? JSON.parse(dataDefinition.data_defn) : [];

 	return (
	  <React.Fragment>
		  <Modal
        title={"Data Defintions"}
        visible={visible}
        onOk={onSave}
        onCancel={onClose}
        destroyOnClose={true}
        width="900px"
        bodyStyle={{height:"300px", left:"100px", padding:"5px"}}
      >
      <Tabs defaultActiveKey={"1"}>
        <TabPane tab="Basic" key="1">
          <Form.Item {...formItemLayout} label="Name">
              <Input id="name" name="name" onChange={onChange} defaultValue={dataDefinition.name} value={dataDefinition.name} placeholder="Name" disabled={!editingAllowed}/>
          </Form.Item>

          <Form.Item {...formItemLayout} label="Description">
              <Input id="description" name="description" onChange={onChange} defaultValue={dataDefinition.description} value={dataDefinition.description} placeholder="Description" disabled={!editingAllowed}/>
          </Form.Item>


        </TabPane>
        <TabPane tab="Layout" key="2">
          <EditableTable columns={layoutColumns} dataSource={dataSource} ref={editableTable} fileType={"csv"}/>                
        </TabPane>
			</Tabs>		        
	  </Modal>   	  	
	</React.Fragment>
  )
}

export default DataDefinitionDetailsDialog