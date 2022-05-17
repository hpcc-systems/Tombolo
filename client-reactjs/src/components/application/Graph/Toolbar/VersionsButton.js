import React, { useState } from 'react';
import { LoadingOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Empty,  message, Alert, Space, Typography, } from 'antd';

import { Toolbar, Menu } from '@antv/x6-react-components';
import { authHeader, handleError } from '../../../common/AuthHeader';
import { useEffect } from 'react';

const Item = Toolbar.Item; // eslint-disable-line
const { confirm } = Modal;

const defaultDialog = { visible: false, loading: false, error: '' };

const VersionsButton = ({ graphRef }) => {
  const [saveGraph, setSaveGraph] = useState({ ...defaultDialog });

  const [versions, setVersions] = useState([]);

  useEffect(()=>{
    (async()=>{
      try {
        const dataflowId = graphRef.current.dataflowId;
        
        const response = await fetch(`/api/dataflowgraph/versions?dataflowId=${dataflowId}`, { headers: authHeader() });
        if (!response.ok) handleError(response);

        const data = await response.json(); //{ id, name, description }[]
        setVersions(data)
      } catch (error) {
        console.log('Error fetch', error);
        message.error(error.message);
      }
    })()
  },[])

  const saveVersion = async ({ name, description }) => {
    try {
      const graph = graphRef.current.toJSON({ diff: true });
      const dataflowId = graphRef.current.dataflowId;

      setSaveGraph((prev) => ({ ...prev, loading: true, error: '' }));
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ graph, name, description, dataflowId }),
      };

      const response = await fetch('/api/dataflowgraph/save_versions', options);
      if (!response.ok) handleError(response);
      const result = await response.json();// { id, name, description, createdBy, createdAt}

      setVersions((prev) => [ ...prev, result ]);
      closeSaveDialog();
      message.success(`Version "${name}" was saved`);
    } catch (error) {
      console.log(error);
      message.error(error.message);
      closeSaveDialog();
    }
  };

  const selectVersion = (id) => {   
    const clickedVersion = versions.find((version) => version.id === id);
    confirm({
      width:'700px',
      title: `Would you like to switch to version "${clickedVersion.name}" ?`,
      content: (
        <>
          <Alert type="warning"  message='Please save your current changes before switching otherwise they will be lost permanently.'/>
          <Space align='start' style={{marginTop:"15px"}}>
            <Typography.Text strong>Description:</Typography.Text>
            <Typography.Text style={{maxWidth:'400px'}}>{clickedVersion.description || 'None'}</Typography.Text>
          </Space>
        </>
      ),
      okText:'Switch',
      onOk() {
        return changeVersion(clickedVersion);
      },
      onCancel() {},
    });
  };
  
  const changeVersion = async (clickedVersion) =>{
    const dataflowId = graphRef.current.dataflowId;
    
    const prevMonitorIds = graphRef.current.getNodes().reduce((acc,node) => {
      if (node.data?.isMonitoring) acc.push(node.data.assetId)
      return acc;
    },[]);

    try {
      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ newVersionId: clickedVersion.id, dataflowId, prevMonitorIds }),
      };
    
      const response = await fetch('/api/dataflowgraph/change_versions', payload);
      if (!response.ok) handleError(response);
    
      const version = await response.json();

      graphRef.current.fromJSON(version.graph);
    
      message.success(`Switched to version ${version.name}!`);
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
    }
  }
  
  const getVersionsList = () => {
    if (versions.length === 0) {
      return (
        <Menu style={{ width: '200px' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Menu>
      );
    } else {
      return (
        <Menu>
          {versions.map((version) => (
            <Menu.Item  className="graph-version-item" onClick={()=>selectVersion(version.id)} key={version.id}>
              <Typography.Text style={{display:'block'}} strong>{version.name}</Typography.Text>
              <Space style={{ fontSize: '13px' }}>
                <Typography.Text type="secondary"> {new Date(version.createdAt).toLocaleString()},</Typography.Text>
                <Typography.Text type="secondary"> {version.createdBy} </Typography.Text>
                <UserOutlined />
              </Space>
            </Menu.Item >
          ))}
        </Menu>
      );
    }
  };

  const openSaveDialog = () => setSaveGraph((prev) => ({ ...prev, visible: true }));
  const closeSaveDialog = () => setSaveGraph({ ...defaultDialog });

  return (
    <>
      <Item
        name="save"
        tooltip="Save graph version"
        disabled={saveGraph.loading}
        active={saveGraph.loading}
        icon={saveGraph.loading ? <LoadingOutlined /> : <SaveOutlined />}
        onClick={openSaveDialog}>
        {saveGraph.loading ? '...Saving' : 'Save Version'}
      </Item>
      <Item name="versions" tooltip="Versions" dropdown={getVersionsList()} />
      <VersionForm
        visible={saveGraph.visible}
        loading={saveGraph.loading}
        onCreate={saveVersion}
        onCancel={closeSaveDialog}
      />
    </>
  );
};

export default VersionsButton;

const VersionForm = ({ visible, loading, onCreate, onCancel }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
     await onCreate(values);
     form.resetFields();
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      destroyOnClose
      title="Create a new version"
      okText="Create"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}>
      <Form form={form} layout="vertical" initialValues={{ name: '', description: '' }}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please provide title for version' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input type="textarea" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
