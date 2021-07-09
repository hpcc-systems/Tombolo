import React, { useContext, useState, useEffect, useRef } from 'react';
import { Table, Input, Button, Popconfirm, Form, Select, Upload, message } from 'antd';
import { DeleteOutlined, UploadOutlined  } from '@ant-design/icons';
import Papa from 'papaparse';
import {parseString} from 'xml2js';
import {omitDeep} from './CommonUtil';
import { store } from '../../redux/store/Store';
import {Constants} from "../common/Constants";

const EditableContext = React.createContext();
const Option = Select.Option;
const OptGroup = Select.OptGroup;
const { TextArea } = Input;

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

//const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
  state = {
    editing: false,
  };

  formRef = React.createRef();

  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
      }
    });
  };

  saveSelect = e => {
    //check if a data defn is selected as type in the table
    let selectedDataDefn = this.datadefinitions.filter(dataDefn => dataDefn.id == e);
    if(selectedDataDefn.length > 0) {
      e = selectedDataDefn[0].name;
    }
    const { record, handleSave, dataIndex } = this.props;
    let dataValueObj = {};
    record.dataDefinition = selectedDataDefn;
    dataValueObj[dataIndex] = e;
    //this.formRef.current.setFieldsValue(dataValueObj);
    record[Object.keys(dataValueObj)[0]] = dataValueObj[Object.keys(dataValueObj)[0]];
    this.formRef.current.validateFields().then(async (error, values) => {
      this.toggleEdit();
      handleSave({ ...record });
    });
  };

  saveText = e => {
    const { record, handleSave, dataIndex } = this.props;
    let dataValueObj = {};
    dataValueObj[dataIndex] = (e.target.value && e.target.value != "") ? e.target.value : e.target.name;    
    record[Object.keys(dataValueObj)[0]] = dataValueObj[Object.keys(dataValueObj)[0]];
    this.formRef.current.validateFields().then(async (error, values) => {
      this.toggleEdit();
      handleSave({ ...record });
    });
  };




  renderCell = form => {
    const { children, dataIndex, record, title, celleditor, celleditorparams, required, showdatadefinitioninfield, datadefinitions, regEx } = this.props;
    const { editing } = this.state;
    this.datadefinitions = datadefinitions
    return editing ? (
    <Form ref={this.formRef}>
      <Form.Item style={{ margin: 0 }} name={dataIndex} initialValue={record[dataIndex]} rules={[
        {
          required: required,
          message: `${title} is required.`,
        },
        {
          validator: async (_, value) => {
            if(dataIndex != 'description') {
              if(regEx && !regEx.test(value)) {
                return Promise.reject(new Error('Please enter a valid '+dataIndex));
              }
            }
          }
        }
      ]}>
         {(celleditor == 'select' ? <Select ref={node => (this.input = node)} allowClear placeholder="Select" onChange={this.saveSelect} >
           {celleditorparams && celleditorparams.values ? celleditorparams.values.map(cellEditorParam =>  <Option key={cellEditorParam} value={cellEditorParam}>{cellEditorParam}</Option>) : null}
          (celleditorparams != undefined) ?
          </Select> : celleditor == 'text' ? <Input ref={node => (this.input = node)} onBlur={this.saveText} /> : <TextArea ref={node => (this.input = node)} rows="5" cols="25" onBlur={this.saveText} />
          )}
      </Form.Item>
      </Form>
    ) : (
      <div
        className="editable-cell-value-wrap"
        onClick={this.toggleEdit}
      >
        {children}
      </div>
    );
  };



  
  render() {


    const {
      editable,
      dataIndex,
      title,
      record,
      index,
      handleSave,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editable ? (
          <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
        ) : (
          children
        )}
      </td>
    );
  }
}

class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    
    dataSource: this.props.dataSource,
      count: this.props.dataSource.length,
      columns: this.props.columns
    };
    this.setupDeleteAction();
    this.props.setData(this.props.dataSource)
  }

  componentDidMount() {
     //Getting global state
     const {viewOnlyModeReducer} = store.getState()
     if(viewOnlyModeReducer.editMode){
       this.setState({
         enableEdit : viewOnlyModeReducer.editMode,
       })
  }
}



  setupDeleteAction = () => {
    const deleteColumn = {
      title: 'Action',
      dataIndex: '',
      width: '8%',
      render: (text, record) =>
        <span>
            <a href="#" onClick={() => this.handleDelete(record.id)}><DeleteOutlined /></a>
        </span>
    }
    if(this.props.editingAllowed ) {
      let columns = this.state.columns;
      columns = columns.push(deleteColumn);
      this.setState({ columns: columns});
    } 
   
  }


  handleDelete = id => {
    let dataSource = [...this.state.dataSource];
    dataSource = dataSource.filter(item => item.id !== id);
    this.setState({ dataSource: dataSource});
    this.props.setData(dataSource)
  };

  handleAdd = () => {
    let { count, dataSource } = this.state;
    const newData = {
      id: count,
      name: '',
      type: ''
    };
    dataSource = [...dataSource, newData];
    this.setState({
      dataSource: dataSource,
      count: count + 1,
    });
    this.props.setData(dataSource)
  };

  handleSave = row => {
    let newData = [...this.state.dataSource];
    let updatedItemIdx=[], editingItem={};
    let iterateChildren = (editingRowId, index, item) => {
      item.children.forEach((childItem, childItemindex) => {
        if(editingRowId == childItem.id) {
          item.children[childItemindex] = row;
          return;
        }
        if(childItem.children) {
          iterateChildren(editingRowId, index, childItem);
        }
      })
    }

    newData.forEach((item, index) => {
      if(row.id == item.id) {
        newData[index] = row;
        return;
      } else if(item.children) {
        iterateChildren(row.id, index, item);
      }
    });
    this.setState({ dataSource: newData });
    //console.log(newData);
    this.props.setData(newData)
  };

  getData = () => {
    let omitResults = omitDeep(this.state.dataSource, 'id')
    return omitResults;
  }

  onDataDefintionSelect = (id) => {
    let selectedDataDefinition = this.props.dataDefinitions.filter(dataDefn => dataDefn.id == id)
    let dataDefn = selectedDataDefinition[0].data_defn;
    this.setState({
      dataSource: dataDefn,
      count: dataDefn.length,
    });
    this.props.setData(dataDefn)
  }

  render() {
    const { dataSource } = this.props;
    const components = {
      body: {
        cell: EditableCell
      },
    };


    const columns = this.state.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: this.props.enableEdit,
          dataIndex: col.dataIndex,
          celleditor: col.celleditor,
          celleditorparams: col.celleditorparams,
          required: col.required ? col.required : false,
          regEx: col.regEx,
          title: col.title,
          handleSave: this.handleSave,
          showdatadefinitioninfield: col.showdatadefinitioninfield ? col.showdatadefinitioninfield : false,
          datadefinitions: this.props.dataDefinitions
        }),
      };
    });

    const fileUploadProps = {
      name: 'file',
      accept: '.csv,.json,.xml',
      beforeUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          switch(file.type) {
            case 'application/vnd.ms-excel':
              parseCsv(e.target.result);
              break;
            case 'application/json':
              parseJson(e.target.result)
              break;
            case 'text/xml':
              parseXml(e.target.result)
              break;
          }

        };
        reader.readAsText(file);
        return false;
      }
    };

    const parseCsv = (csvText) => {
      let layout = [];
      let parsedResult = Papa.parse(csvText);
      let labels = parsedResult.data[0];
      labels.forEach((label, idx) => {
        layout.push({'id': idx, 'name': label, 'type':'', 'eclType':'', description:'', required:false, data_types:''});
      })
      this.setState({ dataSource: layout });
      this.props.setData(layout)
    }

    const parseJson = (json) => {
      let layout = [];
      let parsedJson = JSON.parse(json);

      parseJsonResult(parsedJson);
    }

    const parseJsonResult = (result) => {
      let layout = [];
      let iterateJsonObj = (jsonObj, idx) => {
        let obj = {}, children = [];
        //check if it is an object and not array. if object, iterate over the keys and extract the keys
        if(typeof (jsonObj) === 'object' && !Array.isArray(jsonObj)) {
          Object.keys(jsonObj).forEach((jsonKey, childIdx) => {
            obj = {'id': Math.random() + '-' +childIdx, 'name': jsonKey, 'type':'', 'eclType':'', description:'', required:false, data_types:''};
            if(jsonObj[jsonKey] != null && typeof (jsonObj[jsonKey]) === 'object' && !Array.isArray(jsonObj[jsonKey])) {
              obj.children = iterateJsonObj(jsonObj[jsonKey]);
            } else if(Array.isArray(jsonObj[jsonKey])) {
              obj.children = iterateJsonObj(jsonObj[jsonKey][0]);
            }
            children.push(obj);
          })
        } else if(Array.isArray(jsonObj)) {
          //check if it is an object and not array. if object, iterate over the keys and extract the keys
          let arrayElements = [];
          Object.keys(jsonObj[0]).forEach((arrayElem, childIdx) => {
            let arryObj = {'id': Math.random() + '-' +childIdx, 'name': arrayElem, 'type':'', 'eclType':'', description:'', required:false, data_types:''};
            if(jsonObj[0][arrayElem] != null && typeof (jsonObj[0][arrayElem]) === 'object') {
              arryObj.children = iterateJsonObj(jsonObj[0][arrayElem]);
            }
            arrayElements.push(arryObj);
          })
          obj.children = arrayElements;
          children.push(obj);
        }
        return children;
      }

      Object.keys(result).forEach((key, idx) => {
        let obj = {'id': idx, 'name': key, 'type':'', 'eclType':'', description:'', required:false, data_types:''};
        if(result[key] != null && typeof (result[key]) === 'object' && !Array.isArray(result[key])) {
          obj.children = iterateJsonObj(result[key], idx);
        } else if(Array.isArray(result[key])) {
          obj.children = iterateJsonObj(result[key][0], idx);
        }
        layout.push(obj);
      })
      this.setState({ dataSource: layout });
      this.props.setData(layout)
    }

    const parseXml = (xmlText) => {
      parseString(xmlText, (err, result) => {
        parseJsonResult(result)
      })
    }

    return (
      <div>
        <Table
          components={components}
          rowKey={record => record.id}
          rowClassName={() => 'editable-row'}
          bordered
          dataSource={this.state.dataSource}
          columns={this.props.enableEdit ? columns : columns.filter(column => column.title !== 'Action')}
          pagination={false} scroll={{ y: '40vh' }}
          size="small"
        />
        <div style={{ padding: "5px" }}>
          <span style={{paddingRight: "5px"}}>
            {this.props.enableEdit ?
          <Button onClick={this.handleAdd} type="default" >
            Add a row
          </Button>
          : null }
          </span>
          {this.props.showDataDefinition && this.props.dataDefinitions ?
            <span style={{paddingRight: "5px"}}>
              <Select placeholder="Select from a Data Definition" disabled={!this.props.editingAllowed} onChange={this.onDataDefintionSelect} style={{ width: 230 }}>
                {this.props.dataDefinitions.map(dataDefn => <Option key={dataDefn.id}>{dataDefn.name}</Option>)}
              </Select>
            </span>
            : null}
          <span>
            {(this.props.fileType == 'csv' || this.props.fileType == 'json' || this.props.fileType == 'xml') ?
              <Upload {...fileUploadProps}>
              <Button >
                <UploadOutlined /> Upload a sample file
              </Button>
              </Upload>
            : null }
          </span>
        </div>
      </div>
    );
  }
}

export default EditableTable;