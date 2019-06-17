import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Button,  Select, Table, AutoComplete, Spin } from 'antd/lib';
import "react-table/react-table.css";
import { authHeader, handleError } from "../common/AuthHeader.js"
import DataProfileHTML from "./DataProfileHTML"
const TabPane = Tabs.TabPane;

class FileInstanceDetails extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    visible:false,
    file_definition:"",
    receive_date:"",
    file_count:"",
    customer_name:"",
    item_name:"",
    file_source_id:"",
    data_profile:"",
    profileHTMLAssets:[]
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  getFileInstanceDetails(id) {
      fetch("/api/fileinstance/instance_details?id="+id, {
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
          ...this.state,
            file_definition:data.file_definition,
            receive_date:data.receive_date,
            file_count:data.file_count,
            customer_name:data.customer_name,
            item_name:data.item_name,
            file_source_id:data.file_source_id
        });
        return data;
      })
      .then(data => {
        if(data.data_profile_path != "") {
            this.getFileProfile(data.data_profile_path, data.cluster_id);
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  getFileProfile = (profilePath, clusterId) => {
    var _self = this;
      fetch('/api/hpcc/read/getFileProfileHTML?dataProfileWuid='+profilePath+'&clusterid='+clusterId, {
      headers: authHeader()
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      response.statusText("Error occured while getting the file profile..");
      handleError(response);
    }).then(function(rows) {
      if(rows.length > 0) {
        _self.setState({
          profileHTMLAssets: rows
        });
      }
    }).catch(error => {
      console.log(error);
    });
  }

  showInstanceDetails = (id) => {
    this.setState({
      visible: true
    });
    this.getFileInstanceDetails(id);
  }

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });

    this.saveJobDetails();

    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
      this.props.onClose();
      this.props.onRefresh();
    }, 2000);
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  }


  render() {
    const { visible, confirmLoading, file_definition, receive_date, file_count, customer_name, item_name, file_source_id} = this.state;
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
          title="File Instance Details"
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          bodyStyle={{height:"620px"}}
          destroyOnClose={true}
          width="1200px"
        >
        <Tabs
          defaultActiveKey="1"
        >
          <TabPane tab="Basic" key="1">

           <Form layout="vertical">
           <Form.Item {...formItemLayout} label="Name">
                <Input id="item_name" name="item_name" value={item_name} defaultValue={item_name} placeholder="Item Name" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="File Definition">
                <Input id="file_defn" name="file_definition" value={file_definition} defaultValue={file_definition} placeholder="File Definition" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Receive Date">
                <Input id="receive_date" name="receive_date" value={receive_date} defaultValue={receive_date} placeholder="Receive Date" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Customer Name">
                <Input id="customer_name" name="customer_name" value={customer_name} defaultValue={customer_name} placeholder="Customer Name" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Contact">
                <Input id="item_name" name="item_name" value={item_name} defaultValue={item_name} placeholder="Item Name" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Source Id">
                <Input id="file_source_id" name="file_source_id" value={file_source_id} defaultValue={file_source_id} placeholder="Source Id" />
            </Form.Item>

          </Form>

          </TabPane>
          <TabPane tab="Data Profile" key="7" >
            <div>
                {/*<DataProfileTable data={this.state.fileProfile}/>*/}
                <DataProfileHTML htmlAssets={this.state.profileHTMLAssets}/>
            </div>
          </TabPane>

        </Tabs>
        </Modal>
      </div>
    );
  }
}
const FileInstanceDetailsForm = Form.create()(FileInstanceDetails);
export default FileInstanceDetailsForm;

