import React, { useContext, useState, useEffect, useRef } from 'react';
import { Table, Input, Button, Popconfirm, Form, Select, Upload, message, Icon } from 'antd';
import Papa from 'papaparse';
import {omitDeep} from './CommonUtil';

const EditableContext = React.createContext();
const Option = Select.Option;

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
  state = {
    editing: false,
  };

  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
      }
    });
  };

  saveSelect = e => {
    const { record, handleSave, dataIndex } = this.props;
    let dataValueObj = {};
    dataValueObj[dataIndex] = e;
    this.form.setFieldsValue(dataValueObj);    
    this.form.validateFields({force: true}, (error, values) => {
      console.log(values)
      if (error && error[e.currentTarget.id]) {
        return;
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  };

  saveText = e => {
    const { record, handleSave, dataIndex } = this.props;
    let dataValueObj = {};
    dataValueObj[dataIndex] = e;
    this.form.validateFields({force: true}, (error, values) => {
      console.log(values)
      if (error && error[e.currentTarget.id]) {
        return;
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  };

  renderCell = form => {
    this.form = form;
    const { children, dataIndex, record, title, celleditor, celleditorparams, required } = this.props;
    const { editing } = this.state;
    return editing ? (
    <Form>
      <Form.Item style={{ margin: 0 }}>
        {form.getFieldDecorator(dataIndex, {
          rules: [
            {
              required: true,
              message: `${title} is required.`,
            },
          ],
          initialValue: record[dataIndex],
        }) (celleditor == 'select' ? <Select ref={node => (this.input = node)} placeholder="Select" onChange={this.saveSelect} style={{ width: 170 }} >
          {celleditorparams.values.map(cellEditorParam => <Option key={cellEditorParam} value={cellEditorParam}>{cellEditorParam}</Option>)}
          </Select> : <Input ref={node => (this.input = node)} onPressEnter={this.saveText} onBlur={this.saveText} />)}
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
    this.columns = this.props.columns;
    console.log(this.props.dataSource)
    this.state = {
      dataSource: this.props.dataSource,
      count: this.props.dataSource.length,
    };
  }

  handleDelete = id => {
    const dataSource = [...this.state.dataSource];
    this.setState({ dataSource: dataSource.filter(item => item.id !== id) });
  };

  handleAdd = () => {
    const { count, dataSource } = this.state;
    const newData = {
      id: count,
      name: ''
    };
    this.setState({
      dataSource: [...dataSource, newData],
      count: count + 1,
    });
  };

  handleSave = row => {
    const newData = [...this.state.dataSource];
    let updatedItemIdx=[], editingItem={};
    newData.forEach((item, index) => {
      if(row.id == item.id) {
        updatedItemIdx = [index];
        return;
      } else if(item.children) {
        item.children.forEach((childItem, childItemindex) => {
          if(row.id == childItem.id) { 
            updatedItemIdx = [index, childItemindex];
            return;
          }
        })
      } 
    });
    if(updatedItemIdx.length == 1) {
      editingItem = newData[updatedItemIdx];
      newData.splice(updatedItemIdx, 1, {
        ...editingItem,
        ...row,
      });
    } else {
      editingItem = newData[updatedItemIdx[0]].children[updatedItemIdx[1]];
      newData[updatedItemIdx[0]].children.splice(updatedItemIdx[1], 1, {
        ...editingItem,
        ...row,
      })
    }
    console.log(JSON.stringify(newData));
    this.setState({ dataSource: newData });
  };  

  getData = () => {    
    let omitResults = omitDeep(this.state.dataSource, 'id')
    return omitResults;
  }

  render() {
    const { dataSource } = this.state;
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    };
    const columns = this.columns.map(col => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          celleditor: col.celleditor,
          celleditorparams: col.celleditorparams,
          required: col.required ? col.required : false,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });

    const fileUploadProps = {
      name: 'file',  
      accept: '.csv,.json',   
      beforeUpload(file) {
        const reader = new FileReader();        
        reader.onload = (e) => {
          console.log(file)                                        
          switch(file.type) {
            case 'application/vnd.ms-excel':
              parseCsv(e.target.result);
              break;
            case 'application/json':
              parseJson(e.target.result)
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
    }

    const parseJson = (json) => {
      let layout = [];
      let parsedJson = JSON.parse(json);
      let keys = Object.keys(parsedJson);

      let iterateJson = (key, idx) => {
        let children = [];          
        Object.keys(parsedJson[key]).forEach((childKey, childIdx) => {
          let obj = {'id': idx + '-' +childIdx, 'name': childKey, 'type':'', 'eclType':'', description:'', required:false, data_types:''};
          if(parsedJson[childKey] instanceof Object) {
            obj.children = iterateJson(childKey, childIdx);            
          } 
          children.push(obj);
        })
        return children;
      }

      keys.forEach((key, idx) => {        
        let obj = {'id': idx, 'name': key, 'type':'', 'eclType':'', description:'', required:false, data_types:''};
        if(parsedJson[key] instanceof Object) {
          obj.children = iterateJson(key, idx);
        } 
        layout.push(obj);        
      })
      
      console.log(JSON.stringify(layout))
      this.setState({ dataSource: layout });  
    }

    return (
      <div>        
        <Table
          components={components}
          rowKey={record => record.id}
          rowClassName={() => 'editable-row'}
          bordered
          dataSource={dataSource}
          columns={columns}
          pagination={false} scroll={{ y: 210 }}
          size="small"
        />
        <div style={{ padding: "5px" }}>
          <span style={{paddingRight: "5px"}}>
          <Button onClick={this.handleAdd} type="default" >
            Add a row
          </Button>
          </span>
          <span>
            {(this.props.fileType == 'csv' || this.props.fileType == 'json') ? 
              <Upload {...fileUploadProps}>
              <Button >
                <Icon type="upload" /> Upload a sample file
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