import React, { useEffect, useState } from "react";
import { Table, Button, Row, Col, Modal, Form, Input, message, Tooltip, Popconfirm, Divider, Select, Space } from "antd/lib";
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { useHistory, Link } from "react-router-dom";


import { authHeader } from "../common/AuthHeader.js";
import {applicationActions} from "../../redux/actions/Application"


const Option = Select.Option;

//Form layout
const formItemLayout = {
  labelCol: {
    xs: { span: 2 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 4 },
    sm: { span: 24 },
  },
};

function Clusters() {
  const [clusterWhiteList, setClusterWhiteList] = useState([]); // List of clusters from cluster server/whitelist file
  const clusters = useSelector((state) => state.applicationReducer.clusters); // List of cluster from redux-store. Clusters that are already added to DB
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [addClusterModalVisible, setAddClusterModalVisible] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch()
  const history = useHistory();

  //When component loads
  useEffect(() => {
    getClusterWhiteList();
  }, []);

  // Get clusters whitelist function
  const getClusterWhiteList = async () => {
    try {
      const clusters = await fetch("/api/hpcc/read/getClusterWhitelist", {
        headers: authHeader(),
      });
      const clusterWhiteList = await clusters.json();
      setClusterWhiteList(clusterWhiteList);
    } catch (err) {
      message.error('Failed to fetch cluster white list')
    }
  };

  // When add btn is clicked
  const handleAddClusterBtnClick = () => {
    setAddClusterModalVisible(true);
  };


  // when cancel btn is clicked on the modal
  const handleCancel = () => {
    setAddClusterModalVisible(false);
    setSelectedCluster(null);
    form.resetFields();
  };

  // Add cluster function
  const addCluster = async () => {
    const formData = form.getFieldsValue();

    if (selectedCluster) {
      formData.id = selectedCluster.id;
    }

    try {
      const response = await fetch("/api/hpcc/read/newcluster", {
        method: "post",
        headers: authHeader(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw Error("Failed to save cluster");
      }
      message.success("Successfully added cluster");
      setAddClusterModalVisible(false);
      dispatch(applicationActions.getClusters())
    } catch (err) {
      message.error(err.message);
    }
  };

  // Edit cluster function
  const handleEditCluster = (cluster) =>{
    setAddClusterModalVisible(true)
    form.setFieldsValue({name: cluster.name})
  }
  // Delete cluster function
  const deleteCluster  = async (clusterId) => {
    	var data = JSON.stringify({clusterIdsToDelete:clusterId});
    try{
      const response = await  fetch("/api/hpcc/read/removecluster", {
       method: 'post',
       headers: authHeader(),
       body: data
     })

     if(!response.ok){
      throw Error('Failed to delete cluster')
     }
     message.success('Cluster deleted successfully')
     dispatch(applicationActions.getClusters())

    }catch(err){
      message.error(err.message)
    }
  }


  // Table Columns
  const clusterTableColumns = [
    {
      title: "Name",
      dataIndex: "name",
      width: "20%",
      render: (text, record) => <Link to={`/admin/clusters/${record.id}`}>{text}</Link>
    },
    {
      width: "20%",
      title: "Thor Host",
      dataIndex: "thor_host",
    },
    {
      width: "15%",
      title: "Thor Port",
      dataIndex: "thor_port",
    },
    {
      width: "20%",
      title: "Roxie Host",
      dataIndex: "roxie_host",
    },
    {
      width: "15%",
      title: "Roxie Port",
      dataIndex: "roxie_port",
    },
    {
      width: "10%",
      title: "Action",
      dataIndex: "",
      render: (text, record) => (
        <span>
          <Tooltip placement="right" title={"Edit Cluster"}>
            <EditOutlined onClick={(row) => handleEditCluster(record)} />
          </Tooltip>
          <Divider type="vertical" />
          <Popconfirm
            title="Are you sure you want to delete this Cluster?"
            onConfirm={() => deleteCluster(record.id)}
            icon={<QuestionCircleOutlined />}
          >
            <Tooltip placement="right" title={"Delete Cluster"}>
              <DeleteOutlined />
            </Tooltip>
          </Popconfirm>
          <Divider type="vertical" />
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-end" style={{ marginLeft: "auto" }}>
        <Button className="btn btn-secondary btn-sm" onClick={handleAddClusterBtnClick}>
          <Space>
            <i className="fa fa-plus"> </i> Add Cluster
          </Space>
        </Button>
      </div>

      <Table
        columns={clusterTableColumns}
        rowKey={(record) => record.id}
        dataSource={clusters}
        pagination={clusterWhiteList.length > 10 ? { pageSize: 10 } : false}
      />

      <Modal visible={addClusterModalVisible} onCancel={handleCancel} okText={"Add"} onOk={addCluster}>
        <Form layout="vertical" form={form}>
          <Row gutter={23}>
            <Col span={13}>
              <div className={"form-group"}>
                <Form.Item {...formItemLayout} label="Host" name="name">
                  <Select placeholder="Select a Cluster"  style={{ width: 470 }}>
                    {clusterWhiteList.map((cluster) => (
                      <Option key={cluster.name} value={cluster.name}>
                        {cluster.name + " - " + cluster.thor + ":" + cluster.thor_port}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Col>
          </Row>
          <Form.Item {...formItemLayout} label="User Name" name="username" required>
            <Input />
          </Form.Item>
          <Form.Item {...formItemLayout} label="Password" name="password" >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Clusters;