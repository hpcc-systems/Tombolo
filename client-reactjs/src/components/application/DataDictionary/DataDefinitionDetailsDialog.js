import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom';
import { Modal, Button, Tabs, Select, Form, Typography, Divider, Input, Icon, Table, message, Tag, Tooltip } from 'antd/lib';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { useSelector } from "react-redux";
import { hasEditPermission } from "../../common/AuthUtil.js";
import {eclTypes} from '../../common/CommonUtil';
import EditableTable from "../../common/EditableTable.js";
import { fetchDataDictionary } from "../../common/CommonUtil.js";
import {omitDeep} from '../../common/CommonUtil.js';
import { MarkdownEditor } from "../../common/MarkdownEditor.js"
const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { Paragraph } = Typography;
const { TextArea } = Input;

function DataDefinitionDetailsDialog({selectedDataDefinition, applicationId, onDataUpdated, closeDialog}) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({name:''});
  const [availableDataDefinitions, setAvailableDataDefinitions] = useState([]);
  const [dataDefinition, setDataDefinition] = useState({
    id: '',
    applicationId:'',
    name: '',
    description: '',
    data_defn: []
  });

  const [tags, setTags] = useState({
    products: [],
    inputVisible: false,
    invputValue: ''
  });

  const editableTable = useRef();

  const saveInputRef = useRef(null);

  let isEditing = false;

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
      setEditing(true);
      if(selectedDataDefinition.type == 'file') {
        getFileDetails();
      } else {
        getDataDefintionDetails();
      }

    }
   }, [selectedDataDefinition])

  useEffect(() => {
    if (tags.inputVisible) {
      saveInputRef.current.focus();
    }
  }, [tags]);

  const onClose = () => {
  	setVisible(false);
    setEditing(false);
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
      dataToSave.data_defn = JSON.stringify(dataDefinition.data_defn);
      dataToSave.products = tags.products.join(',');

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
        onClose()
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
      setTags(prevState => {
        return { ...prevState, products: (data[0].products && data[0].products.length) > 0 ? data[0].products.split(',') : [] }
      });
    }).catch(error => {
      console.log(error);
    });
  };

  const getFileDetails = async () => {
    fetch("/api/file/read/file_details?file_id="+selectedDataDefinition.id+"&app_id="+applicationId, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then((data) => {
      let layout = data.file_layouts.map((layout) => {
        return {
          "name": layout.name,
          "valueDescription": layout.description,
          "type": layout.type,
          "possibleValue": ''
        }
      })

      let dataDefn = {
        "data_defn": layout,
        "id": data.basic.id,
        "applicationId": applicationId,
        "name": data.basic.title,
        "description": data.basic.description
      }
      setDataDefinition(dataDefn);
    })
  }

  const onChange = (e) => {
    setFormErrors({'name':''});
  	const {name, value} = e.target;
    setDataDefinition({...dataDefinition, [name]: value});
  }

  const validateForm = () => {
    if(dataDefinition.name == '' || /^[!@#\$%\^\&*\)\(+=._-]+$/g.test(dataDefinition.name)) {
      setFormErrors({'name':'Please enter a valid name for the Data Definition'});
      return false;
    }
    if(!editing && availableDataDefinitions.filter(availableDataDefn => availableDataDefn.name == dataDefinition.name).length > 0) {
      setFormErrors({'name':'Duplicate data defintion name. Please select a different name.'});
      return false;
    }
    return true;
  }

  const formItemLayout = {
    labelCol: {
      xs: { span: 8 },
      sm: { span: 3 },
    },
    wrapperCol: {
      xs: { span: 2 },
      sm: { span: 12 },
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
      showdatadefinitioninfield: true,
      celleditorparams: {
        values: eclTypes.sort()
      }
    },
    {
      title: 'Value Description',
      dataIndex: 'valueDescription',
      editable: true
    },
    {
      title: 'Possible Value',
      dataIndex: 'possibleValue',
      editable: true
    },

  ]

  const handleNewProduct = () => {
    const { inputValue } = tags;
    let { products } = tags;
    if (inputValue && products.indexOf(inputValue) === -1) {
      products = [...products, inputValue];
    }
    setTags({
      products,
      inputVisible: false,
      inputValue: '',
    });
  };

  const handleProductChange = (e) => {
    e.persist();
    setTags(prevState => {
      return { ...prevState, inputValue: e.target.value }
    });
  };

  const handleProductTagClose = removedTag => {
    const products = tags.products.filter(tag => tag !== removedTag);
    setTags({ products });
  };

  const showNewProductTag = () => {
    setTags(prevState => {
      return { ...prevState, inputVisible: true }
    });
  }

  const dataSource = (dataDefinition.data_defn && dataDefinition.data_defn.length) > 0 ? dataDefinition.data_defn : [];

 	return (
	  <React.Fragment>
		  <Modal
        title={"Data Defintions"}
        visible={visible}
        onOk={onSave}
        onCancel={onClose}
        destroyOnClose={true}
        width="1200px"
      >
      <Tabs defaultActiveKey={"1"}>
        <TabPane tab="Basic" key="1">
          <Form.Item {...formItemLayout} label="Name">
              <Input id="name" name="name" onChange={onChange} defaultValue={dataDefinition.name} value={dataDefinition.name} placeholder="Name" disabled={!editingAllowed}/>
              {formErrors.name.length > 0 &&
              <span className='error'>{formErrors.name}</span>}
          </Form.Item>

          <Form.Item {...formItemLayout} label="Description">
            <MarkdownEditor id="defn_desc" name="description" onChange={onChange} targetDomId="defnDescr" value={dataDefinition.description} disabled={!editingAllowed}/>
          </Form.Item>

          <Form.Item {...formItemLayout} label="Products">
            <div>
              {tags.products.map((tag, index) => {
                const isLongTag = tag.length > 20;
                const tagElem = (
                  <Tag color="geekblue" key={tag} closable={index !== 0} onClose={() => handleProductTagClose(tag)}>
                    {isLongTag ? `${tag.slice(0, 20)}...` : tag}
                  </Tag>
                );
                return isLongTag ? (
                  <Tooltip title={tag} key={tag}>
                    {tagElem}
                  </Tooltip>
                ) : (
                  tagElem
                );
              })}
              {tags.inputVisible && (
                <Input
                  ref={saveInputRef}
                  type="text"
                  size="small"
                  style={{ width: 78 }}
                  value={tags.inputValue}
                  onChange={handleProductChange}
                  onBlur={handleNewProduct}
                  onPressEnter={handleNewProduct}
                />
              )}
              {!tags.inputVisible && (
                <Tag color="geekblue" onClick={showNewProductTag} style={{ background: '#fff', borderStyle: 'dashed' }}>
                  <Icon type="plus" /> New Product
                </Tag>
              )}
          </div>
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