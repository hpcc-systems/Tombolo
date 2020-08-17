import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom';
import { Modal, Button, Tabs, Select, Form, Typography, Divider, Input, Icon, Table, message } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { useSelector } from "react-redux";
import { hasEditPermission } from "../../common/AuthUtil.js";
import {eclTypes} from '../../common/CommonUtil';
import EditableTable from "../../common/EditableTable.js";
import { fetchDataDictionary } from "../../common/CommonUtil.js";
import {omitDeep} from '../../common/CommonUtil.js';
const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { Paragraph } = Typography;

function DataDefinitionDetailsDialog({selectedDataDefinition, applicationId, onDataUpdated, closeDialog}) {
  const [visible, setVisible] = useState(false);
  const [formErrors, setFormErrors] = useState({name:''});
  const [availableDataDefinitions, setAvailableDataDefinitions] = useState([]);
  const [dataDefinition, setDataDefinition] = useState({
    id: '',
    applicationId:'',
    name: '',    
    description: '',
    data_defn: []
  });
  
  const editableTable = useRef();

  useEffect(() => {
    const fetchData = async () => {
     const data = await fetchDataDefinitions();
     setAvailableDataDefinitions(data);
    }
    if(applicationId) {    
      fetchData();      
      setVisible(true);
    }
  }, [applicationId])

  useEffect(() => {
    if(selectedDataDefinition != '') {
      getDataDefintionDetails();      
    }
   }, [selectedDataDefinition])

  const onClose = () => {
  	setVisible(false);
    closeDialog();
  }

  const setLayoutData = (data) => {
    let omitResults = omitDeep(data, 'id')    
    dataDefinition.data_defn = omitResults;
  }

  const onSave = () => {
    if(validateForm()) {
      message.config({top:130})
      let dataToSave = dataDefinition;
      dataToSave.application_id = applicationId;      
      dataToSave.data_defn = (editableTable && editableTable.current) ? JSON.stringify(editableTable.current.getData()) : '';
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
  }

  const fetchDataDefinitions =  () => {    
    return new Promise(async (resolve, reject) => {
      try {
        let dataDefn = await fetchDataDictionary(applicationId);      
        resolve(dataDefn)  
      } catch (err) {
        console.log(err)
        reject(err)
      }              
    })    
  }

  const getDataDefintionDetails = async () => {  
    fetch('/api/data-dictionary?application_id='+applicationId+'&id='+selectedDataDefinition.id, {
      headers: authHeader()
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      setDataDefinition(...data); 
    }).catch(error => {
      console.log(error);
    });
  };    

  const onChange = (e) => {	
    setFormErrors({'name':''});
  	const {name, value} = e.target;
    setDataDefinition({...dataDefinition, [name]: value});    
  }

  const validateForm = () => {
    if(dataDefinition.name == '') {
      setFormErrors({'name':'Please enter a name for the Data Definition'});
      return false;
    }
    return true;
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
      dataIndex: 'type',
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
              {formErrors.name.length > 0 && 
              <span className='error'>{formErrors.name}</span>}
          </Form.Item>

          <Form.Item {...formItemLayout} label="Description">
              <Input id="description" name="description" onChange={onChange} defaultValue={dataDefinition.description} value={dataDefinition.description} placeholder="Description" disabled={!editingAllowed}/>
          </Form.Item>


        </TabPane>
        <TabPane tab="Layout" key="2">
          <EditableTable 
            columns={layoutColumns} 
            dataSource={dataSource} 
            ref={editableTable} 
            fileType={"csv"} 
            editingAllowed={editingAllowed}
            dataDefinitions={availableDataDefinitions.filter(dataDefn => dataDefn.name != selectedDataDefinition.name)}
            showDataDefinition={true}   
            setData={setLayoutData}/>            
        </TabPane>
			</Tabs>		        
	  </Modal>   	  	
	</React.Fragment>
  )
}

export default DataDefinitionDetailsDialog