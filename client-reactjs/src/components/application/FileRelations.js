import React, { Component } from "react";
import { Table, Input, InputNumber, Popconfirm, Form, AutoComplete } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { SearchOutlined  } from '@ant-design/icons';

/*const FormItem = Form.Item;
const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
  state = {
    fileSearchSuggestions: []
  }

searchFiles(searchString) {
    if(searchString.length <= 3)
      return;
    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString});
    fetch("/api/file/read/file_fields?file_ids="+this.props.relations.map(o => o.id).join(','), {
      headers: authHeader()
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(suggestions => {
      this.setState({
        ...this.state,
        fileSearchSuggestions: suggestions
      });
    }).catch(error => {
      console.log(error);
    });
  }

  getInput = () => {
    if (this.props.inputType === 'number') {
      return <InputNumber />;
    } else if(this.props.inputType === 'autocomplete') {
        return <AutoComplete
        className="certain-category-search"
        dropdownClassName="certain-category-search-dropdown"
        dropdownMatchSelectWidth={false}
        dropdownStyle={{ width: 300 }}
        size="large"
        style={{ width: '100%' }}
        dataSource={this.state.fileSearchSuggestions}
        onChange={(value) => this.searchFiles(value)}
        placeholder="Search files"
        optionLabelProp="value"
      >
        <Input suffix={<Icon type="search" className="certain-category-icon" />} />
      </AutoComplete>
    }
    return <Input />;
  };

  render() {
    const {
      editing,
      dataIndex,
      title,
      inputType,
      record,
      index,
      ...restProps
    } = this.props;
    return (
      <EditableContext.Consumer>
        {(form) => {
          const { getFieldDecorator } = form;
          return (
            <td {...restProps}>
              {editing ? (
                <FormItem style={{ margin: 0 }}>
                  {getFieldDecorator(dataIndex, {
                    rules: [{
                      required: true,
                      message: `Please Input ${title}!`,
                    }],
                    initialValue: record[dataIndex],
                  })(this.getInput())}
                </FormItem>
              ) : restProps.children}
            </td>
          );
        }}
      </EditableContext.Consumer>
    );
  }
}

class FileRelations extends Component {
  constructor(props) {
    super(props);
    this.state = { editingKey: '', fileSearchSuggestions:[] };
    this.handleFieldRelationsSave = this.handleFieldRelationsSave.bind(this);
    this.columns = [
      {
        title: 'Field',
        dataIndex: 'field',
        width: '25%'
      },
      {
        title: 'Source Field',
        dataIndex: 'source_field',
        width: '15%',
        editable: true,
      },
      {
        title: 'Requirements',
        dataIndex: 'requirements',
        width: '40%',
        editable: true,
      },
      {
        title: 'Action',
        render: (text, record) => {
          const editable = this.isEditing(record);
          return (
            <div>
              {editable ? (
                <span>
                  <EditableContext.Consumer>
                    {form => (
                      <a
                        href="javascript:;"
                        onClick={() => this.handleFieldRelationsSave(form, record.key)}
                        style={{ marginRight: 8 }}
                      >
                        Save
                      </a>
                    )}
                  </EditableContext.Consumer>
                  <Popconfirm
                    title="Sure to cancel?"
                    onConfirm={() => this.cancel(record.key)}
                  >
                    <a>Cancel</a>
                  </Popconfirm>
                </span>
              ) : (
                <a onClick={() => this.edit(record.key)}>Edit</a>
              )}
            </div>
          );
        },
      },
    ];
  }

  componentDidMount() {
    this.setState({
      data: this.props.data
    });
  }

  isEditing = record => record.key === this.state.editingKey;

  cancel = () => {
    this.setState({ editingKey: '' });
  };

  handleFieldRelationsSave(form, key) {
    form.validateFields((error, row) => {
      if (error) {
        return;
      }
      const newData = [...this.state.data];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        this.setState({ data: newData, editingKey: '' });
      } else {
        newData.push(row);
        this.setState({ data: newData, editingKey: '' });
      }
    });
    setTimeout(() => {
      this.props.onChange(this.state.data);
    }, 200);
  }

  edit(key) {
    this.setState({ editingKey: key });
  }

  render() {
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell
      },
    };
    const {fileSearchSuggestions} = this.state;

    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: record => ({
          record,
          inputType: col.dataIndex === 'source_field' ? 'autocomplete': 'text',
          dataIndex: col.dataIndex,
          title: col.title,
          editing: this.isEditing(record),
          relations: this.props.relations
        }),
      };
    });

    return (
      <Table
        components={components}
        bordered
        rowKey={record => record.field}
        dataSource={this.state.data}
        columns={columns}
        rowClassName="editable-row"
        pagination={{ pageSize: 10 }} scroll={{ y: 380 }}
      />
    );
  }
}*/

export default FileRelations;