import { LoadingOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Empty, Menu, message } from 'antd';

import { Toolbar } from '@antv/x6-react-components';
import { useState } from 'react';
import { authHeader, handleError } from '../../../common/AuthHeader';
import { useEffect } from 'react';

const Item = Toolbar.Item; // eslint-disable-line

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

  const selectVersion = (e) => {
    message.info('Click on menu item.');
    console.log('click', e);
  };

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
