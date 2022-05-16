import { LoadingOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Empty, Menu, message, Alert } from 'antd';

import { Toolbar } from '@antv/x6-react-components';
import { useState } from 'react';
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
      const result = await response.json();// { id, name, description }

      setVersions((prev) => [ ...prev, result ]);
      closeSaveDialog();
      message.success(`Version "${name}" was saved`);
    } catch (error) {
      console.log(error);
      message.error(error.message);
      closeSaveDialog();
    }
  };

  const selectVersion = (e) => {;
    const clickedVersion = versions.find((version) => version.id === e.key);
    
    confirm({
      title: 'Do you want to go to different version?',
      content: (
        <Alert
          type="warning"
          description={`You are about to switch graph to version "${clickedVersion.name}", please save your current changes before switching otherwise they will be lost permanently. Press "OK" to continue, or "Cancel" to return.`}
        />
      ),
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
        <Menu>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Menu>
      );
    } else {
      return (
        <Menu
          onClick={selectVersion}
          items={versions.map((version) => ({
            key: version.id,
            label: version.name,
            icon: <UserOutlined />,
          }))}
        />
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
        {saveGraph.loading ? '...saving' : 'Save'}
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
