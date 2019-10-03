import React, { Component } from "react";
import { Table,message,Spin,Modal,Tabs,Form,Input,Select } from 'antd/lib';
import { authHeader, handleError } from "../common/AuthHeader.js";
const { confirm } = Modal;
const Option = Select.Option;
class AddRegulations extends Component {
    constructor(props) {
      super(props);
    }
    state = {
        dataTypes:[],
        selectedRowKeys:[],
        SelectedRegulation:[],
        regulations:[],
        compliance:"",
        title:""
    }
    componentDidMount(){
        this.setState({
            compliance:this.props.compliance,
            SelectedRegulation:this.props.selectedRegulation,
            regulations:this.props.regulations
        });
        if(this.props.compliance==""){
            this.setState({
                title:"Add Controls and Regulations"
            });
        }
        else{
            this.setState({
                title:"Edit Controls and Regulations"
            });
        }
        this.getDataTypesList();
    }
    getDataTypesList() {
        var _self=this;
        fetch("/api/controlsAndRegulations/dataTypes", {
          headers: authHeader()
        }).then((response) => {
            if(response.ok) {
              return response.json();
            }
            handleError(response);
          })
          .then(data => {
            _self.setState({
              dataTypes: data,
              initialDataLoading: false
            });
            if(_self.state.SelectedRegulation.length>0){
                _self.setState({
                selectedRowKeys: _self.state.SelectedRegulation.map(regulation => regulation.data_types)
            });
            }
          }).catch(error => {
            console.log(error);
          });
      }
     SaveDetails() {
       var _self=this;
        var regulations=[];
        var compliance=this.state.compliance;
        (this.state.selectedRowKeys).forEach(function (item, idx) {
            regulations.push({"compliance":compliance, "data_types":item});
        });
      fetch('/api/controlsAndRegulations/saveRegulations', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({regulations:regulations,compliance:this.state.compliance,
        oldCompName:this.props.compliance})
      }).then(function(response) {
          if(response.ok) {
          message.config({top:150})
          message.success("Controls and Regulations saved successfully");
          _self.props.onClose();
          }
      }).then(function(data) {
        console.log('Saved..');
      });
    }
    handleOk = () => {
        var exists=this.state.regulations.filter(key => key.compliance.toUpperCase() == this.state.compliance.toUpperCase()).length > 0;
        if(this.state.compliance=="")
        {
          message.config({top:150})
          message.error("Please enter compliance");
        }
        else if((this.props.compliance!="" && this.props.compliance.toUpperCase()!=this.state.compliance.toUpperCase() && exists)
        ||(this.props.compliance=="" && exists)){
          message.config({top:150})
          message.error("Compliance already exist.");
        }
        else if(this.state.selectedRowKeys && this.state.selectedRowKeys.length==0)
        {message.config({top:150})
        message.error("Please select the Data Type");}
        else{
        var _self=this;
        confirm({
          content: 'Are you sure you want to submit?',
          onOk() {
            _self.SaveDetails();
          }
        });
      }
    }
    handleCancel = () => {
      this.props.onClose();
    }
    onSelectedRowChange = (selectedRowKeys) => {
        this.setState({
          selectedRowKeys
        });
      }

    handleComplianceChange=(e)=>{
        this.setState({compliance: e.target.value });
      }
    render() {

        const selectedRowKeys=this.state.selectedRowKeys;
        const rowSelection = {
            selectedRowKeys,
            onChange:this.onSelectedRowChange.bind(this)
            };
          const Columns = [{
            title: 'Data Types',
            dataIndex: 'name',
            render: (text, row) => <a >{row.name}</a>
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
        <div>
          <Modal
	        title={this.state.title}
	        visible={true}
            onOk={this.handleOk.bind(this)}
            onCancel={this.handleCancel}
            destroyOnClose={true}
            bodyStyle={{height:"560px"}}
            okText="Save"
	        >
          <Form layout="vertical">
          <Form.Item {...formItemLayout} label="Compliance :">
          <Input id="compliance" onChange={this.handleComplianceChange}  name="compliance" placeholder="" value={this.state.compliance}/>
		            </Form.Item>
                    <Table
                        rowSelection={rowSelection}
                        columns={Columns}
                        rowKey={record => record.name}
                        dataSource={this.state.dataTypes}
                        pagination={{ pageSize: 10 }}
                        size="small"
                    />
	        </Form>
          </Modal>
       </div>
        );
      }
}
export default AddRegulations;