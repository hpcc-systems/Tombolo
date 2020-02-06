import React, { Component } from "react";
import { Table, Button, Row, Col, Modal, Form, Input, Icon, Select, notification, Tooltip, Popconfirm, Divider, AutoComplete, message, Radio } from 'antd/lib';
import BreadCrumbs from "../common/BreadCrumbs";
import { authHeader, handleError } from "../common/AuthHeader.js";
import { connect } from 'react-redux';
import ShareApp from "./ShareApp";
const Option = Select.Option;

class Consumers extends Component {
  constructor(props) {
    super(props);


  }
  state = {
  	consumers:[],
  	selectedConsumer:'',
  	removeDisabled: true,
  	showAddConsumer: false,
  	confirmLoading: false,
    isEditing: false,
    isConsumer: true,
  	newConsumer : {
	  	name: '',
      type:'',
      contact_name:'',
      contact_email:'',
      ad_group:''
    },
    showAdGroupField: false,
    adGroupSearchResults: [],
    openShareAppDialog:false,
    appId:"",
    appTitle:"",
    submitted: false
  }

  componentDidMount() {
  	this.getConsumers();
  }

  onSelectedRowKeysChange = (selectedRowKeys, selectedRows) => {
    var appsSelected = this.state.selectedApplications, removeDisabled = true;
    appsSelected = selectedRows;
    this.setState({
      selectedApplications: appsSelected,
    });
    removeDisabled = (selectedRows.length > 0) ? false : true;
	this.setState({
	  removeDisabled: removeDisabled
	});

  }

  getConsumers() {
  	var url="/api/consumer/consumers";
  	fetch(url, {
      headers: authHeader()
    })
	.then((response) => {
	  if(response.ok) {
      return response.json();
    }
    handleError(response);
	})
	.then(data => {
	    this.setState({
	    	consumers: data
	    });
  	})
  	.catch(error => {
    	console.log(error);
  	});
  }

  handleEditConsumer(consumer_id) {
    this.setState({
      isEditing: true
    });
    fetch("/api/consumer/consumer?consumer_id="+consumer_id, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
	  .then(data => {
      console.log(JSON.stringify(data))
      this.setState({
        ...this.state,
        newConsumer: {
          ...this.state.newConsumer,
          id : data.consumer.id,
          name: data.consumer.name,
          type: data.consumer.type,
          contact_name: data.consumer.contact_name,
          contact_email: data.consumer.contact_email,
          ad_group: data.consumer.ad_group
        }
      });
      this.setState({
        showAddConsumer: true,
        showAdGroupField: (data.consumer.type == 'Internal') ? true : false
      });

    })
  	.catch(error => {
    	console.log(error);
  	});
  }

  handleRemove = (consumer_id) => {
  	var data = JSON.stringify({consumerToDelete:consumer_id});
  	console.log(data);
    fetch("/api/consumer/delete", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(suggestions => {
      notification.open({
          message: 'Consumer Removed',
          description: 'The Consumer has been removed.',
          onClick: () => {
            console.log('Closed!');
          },
      });
      this.getConsumers();
      }).catch(error => {
        console.log(error);
      });
  }

  handleAdd = (event) => {
  	this.setState({
    	showAddConsumer: true,
      isEditing: false
    });
  }

  handleAddConsumerCancel= (event) => {
  	this.setState({
      ...this.state,
        newConsumer: {
          ...this.state.newConsumer,
          id : '',
          name: '',
          type: '',
          contact_name: '',
          contact_email: '',
          ad_group: ''
        },
        showAddConsumer: false,
        showAdGroupField: false,
        confirmLoading: false,
        submitted:false
    });
  }

  searchADGroups(searchString) {
    if(searchString.length <= 2)
      return;
    fetch("/api/ldap/groupSearch?groupName="+searchString, {
      method: 'get',
      headers: authHeader()
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(groupSearchResults => {
      this.setState({
        ...this.state,
        adGroupSearchResults: groupSearchResults
      });
    }).catch(error => {
      console.log(error.text);
      message.error("There was error while searching active directory");
    });
  }

  async onGroupSelected(selectedGroup) {
    this.setState({
      ...this.state,
      newConsumer: {
        ...this.state.newConsumer,
        ad_group: selectedGroup
      }
    });
  }

  onChange = (e) => {
    this.setState({...this.state,confirmLoading:false, newConsumer: {...this.state.newConsumer, [e.target.name]: e.target.value }});
  }

  onConsumerSupplierChange = (e) => {
    console.log(e.target.value)
    let isConsumer = e.target.value == "Consumer" ? true : false;
    this.setState({
      isConsumer: isConsumer
    });
  }

  handleAddConsumerOk = () => {
    this.setState({
      confirmLoading: true,
      submitted: true
    });
    if(this.state.newConsumer.name){
    var userId=(this.props.user) ? this.props.user.id:"" ;

    let data = JSON.stringify({"name" : this.state.newConsumer.name, "type" : this.state.newConsumer.type, "contact_name":this.state.newConsumer.contact_name, "contact_email":this.state.newConsumer.contact_email, "ad_group":this.state.newConsumer.ad_group, "assetType":this.state.isConsumer ? "Consumer" : "Supplier"});
	  console.log('data: '+data);
    fetch("/api/consumer/consumer", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(suggestions => {
	  	this.setState({
      ...this.state,
        isConsumer: true,
        newConsumer: {
          ...this.state.newConsumer,
          id : '',
          name: '',
          type: '',
          contact_name: '',
          contact_email: '',
          ad_group: ''
        },
        showAddConsumer: false,
        confirmLoading: false,
        isEditing: false,
        submitted:false
      });
	    this.getConsumers();
    }).catch(error => {
      console.log(error);
    });
  }
  }

  handleClose = () => {
    this.setState({
      openShareAppDialog: false
    });
  }

  handleTypeChange = (value) => {
    var showADGroupField = false;
    if(value == 'Internal') {
        showADGroupField = true;
    }

    this.setState({...this.state, newConsumer: {...this.state.newConsumer, type: value }});

    this.setState({
      showAdGroupField: showADGroupField
    });
  }

  render() {
  	var isNameDisabled = false;
    const { confirmLoading, isEditing, adGroupSearchResults} = this.state;

    if(isEditing) {
      isNameDisabled=true;
    }
  	const consumerColumns = [
    {
      width: '15%',
      title: 'Name',
      dataIndex: 'name'
    },
    {
      width: '15%',
      title: 'Contact',
      dataIndex: 'contact_name'
    },
    {
      width: '15%',
      title: 'Contact Email',
      dataIndex: 'contact_email'
    },
    {
      width: '10%',
      title: 'Consumer/Supplier',
      dataIndex: 'assetType'
    },
    {
      width: '5%',
      title: 'Type',
      dataIndex: 'type'
    },
    {
      width: '15%',
      title: 'AD Group',
      dataIndex: 'ad_group'
    },
    ,{
      width: '5%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleEditConsumer(record.id)}><Tooltip placement="right" title={"Edit Consumer"}><Icon type="edit" /></Tooltip></a>
          <Divider type="vertical" />
          <Popconfirm title="Are you sure you want to delete this Consumer?" onConfirm={() => this.handleRemove(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
            <a href="#"><Tooltip placement="right" title={"Delete Consumer"}><Icon type="delete" /></Tooltip></a>
          </Popconfirm>
        </span>
    }];
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

    return (
    <React.Fragment>
      <div className="d-flex justify-content-end" style={{paddingTop:"60px"}}>
        <BreadCrumbs applicationId={this.state.applicationId}/>
        <span style={{ marginLeft: "auto" }}>
            <Tooltip placement="bottom" title={"Click to add a new Consumer"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.handleAdd()}><i className="fa fa-plus"></i> Add</Button>
            </Tooltip>
          </span>
      </div>
      <div style={{padding:"15px"}}>
      	<Table
          columns={consumerColumns}
          rowKey={record => record.id}
          dataSource={this.state.consumers}/>
      </div>

      <div>
	      <Modal
	          title="Add Consumer/Supplier"
	          visible={this.state.showAddConsumer}
	          onOk={this.handleAddConsumerOk.bind(this)}
	          onCancel={this.handleAddConsumerCancel}
	          confirmLoading={confirmLoading}
	        >
		        <Form layout="vertical">
              <div className={'form-group'+ (this.state.submitted && !this.state.newConsumer.name ? ' has-error' : '')}>
                <Radio.Group onChange={this.onConsumerSupplierChange} value={this.state.isConsumer ? "Consumer" : "Supplier"}>
                  <Radio value={"Consumer"}>Consumer</Radio>
                  <Radio value={"Supplier"}>Supplier</Radio>
                </Radio.Group>
              </div>

            <div className={'form-group'}>
		          <Form.Item {...formItemLayout} label="Name">
    						<Input id="consumer_title" name="name" onChange={this.onChange} placeholder="Name" value={this.state.newConsumer.name} disabled={isNameDisabled}/>
                {this.state.submitted && !this.state.newConsumer.name &&
                        <div className="help-block">Consumer Name is required</div>
                }
  	          </Form.Item>
              </div>
              <Form.Item {...formItemLayout} label="Type">
                <Select name="type" id="consumer_type" onSelect={this.handleTypeChange} value={this.state.newConsumer.type}>
                  <Option value=""></Option>
                    <Option value="External">External</Option>
                    <Option value="Internal">Internal</Option>
                </Select>
              </Form.Item>
              <Form.Item {...formItemLayout} label="Contact Name">
                <Input id="consumer_contact" name="contact_name" onChange={this.onChange} placeholder="Contact Name" value={this.state.newConsumer.contact_name}/>
              </Form.Item>
              <Form.Item {...formItemLayout} label="Contact Email">
                <Input id="consumer_contact_email" name="contact_email" onChange={this.onChange} placeholder="Contact Email" value={this.state.newConsumer.contact_email}/>
              </Form.Item>
              {this.state.showAdGroupField ?
                <Form.Item {...formItemLayout} label="AD Group">
                <AutoComplete
                  className="certain-category-search"
                  dropdownClassName="certain-category-search-dropdown"
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ width: 300 }}
                  size="large"
                  style={{ width: '100%' }}
                  dataSource={adGroupSearchResults}
                  onChange={(value) => this.searchADGroups(value)}
                  onSelect={(value) => this.onGroupSelected(value)}
                  placeholder="Search AD groups"
                  optionLabelProp="value"
                  defaultValue={this.state.newConsumer.ad_group}
                >
                  <Input suffix={<Icon type="search" className="certain-category-icon" />} />
                </AutoComplete>
              </Form.Item>
              : ""}
  	        </Form>
	        </Modal>
     </div>
   </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  return {
      user
  };
}
const connectedApp = connect(mapStateToProps)(Consumers);
export { connectedApp as AdminConsumers };
//export default Applications;