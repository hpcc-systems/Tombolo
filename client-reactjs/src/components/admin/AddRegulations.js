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
        identityDetails:[],
        selectedRowKeys:[],
        SelectedRegulation:[],
        complianceList:[],
        compliance:"",
        title:""
    }  
    componentDidMount(){              
        this.setState({
            compliance:this.props.compliance,
            SelectedRegulation:this.props.selectedRegulation,
            complianceList:this.props.complianceList
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
        this.getIdentityDetailList();
    }
    getIdentityDetailList() {
        var _self=this;       
        fetch("/api/controlsAndRegulations/identityDetails", {
          headers: authHeader()
        }).then((response) => {
            if(response.ok) {              
              return response.json();
            }
            handleError(response);
          })
          .then(data => {
            _self.setState({
              identityDetails: data,
              initialDataLoading: false
            });
            if(_self.state.SelectedRegulation.length>0){
                _self.setState({
                selectedRowKeys: _self.state.SelectedRegulation.map(regulation => regulation.identity_details)
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
            regulations.push({"compliance":compliance, "identity_details":item});
        });
      fetch('/api/controlsAndRegulations/saveRegulations', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({regulations:regulations,compliance:this.state.compliance})
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
        if(this.state.selectedRowKeys && this.state.selectedRowKeys.length==0)
        {message.config({top:150})
        message.error("Please select the Identity Details");}
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

    handleComplianceChange=(value)=>{
        this.setState({compliance: value });
      }
    render() {
       
        const selectedRowKeys=this.state.selectedRowKeys;
        const rowSelection = {
            selectedRowKeys,
            onChange:this.onSelectedRowChange.bind(this) 
            };
          const Columns = [{
            title: 'Identity Details',
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
            bodyStyle={{height:"460px"}}
            okText="OK"
	        >  
          <Form layout="vertical">
          <Form.Item {...formItemLayout} label="Compliance :">
          {this.props.compliance=="" ?
                <Select name="compliance" id="compliance" style={{ width: 200 }} onSelect={this.handleComplianceChange} value={this.state.compliance}>
                {this.state.complianceList.map(compliance => (
                <Option key={compliance}>{compliance}</Option>))}
                </Select>  
                :<span>{this.props.compliance}</span>}
		            </Form.Item>		            
                    <Table
                        rowSelection={rowSelection}
                        columns={Columns}
                        rowKey={record => record.name}
                        dataSource={this.state.identityDetails}
                        pagination={{ pageSize: 5 }}
                        size="small"
                    />
	        </Form>
          </Modal>
       </div>
        );
      }
}
export default AddRegulations;