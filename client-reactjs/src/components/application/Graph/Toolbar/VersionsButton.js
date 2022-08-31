/* eslint-disable react/no-unescaped-entities */
/* eslint-disable quotes */
import React, { useState } from 'react';
import {
  CaretRightOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  PauseOutlined,
  RollbackOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Modal,
  Form,
  Input,
  Empty,
  notification,
  Button,
  message,
  Alert,
  Space,
  Typography,
  Divider,
  Badge,
  Tag,
} from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Toolbar, Menu } from '@antv/x6-react-components';
import { authHeader, handleError } from '../../../common/AuthHeader';
import { getWorkingCopyGraph, saveWorkingCopyGraph } from '../../../common/CommonUtil';

const Item = Toolbar.Item; // eslint-disable-line
const { confirm } = Modal;

const NOTIFICATION_CONF = {
  placement: 'top',
  style: {
    width: 'auto',
    maxWidth: '750px',
  },
};

const defaultDialog = { visible: false, version: null, loading: false, error: '', saveWC: false };

const VersionsButton = ({ graphRef }) => {
  // State for saving version name and description
  const [saveGraph, setSaveGraph] = useState({ ...defaultDialog });
  // Keep list of all dataflow versions in this list
  const [versions, setVersions] = useState([]);
  // Keep track of "active", clicked, versions here
  const [clickedVersion, setClickedVersion] = useState({ id: '', name: '', description: '' });
  const { t } = useTranslation(['common', 'dataflow']); // t for translate -> getting namespaces relevant to this file

  useEffect(() => {
    notification.config({ top: 70, maxCount: 1, duration: 8 });
    // on initial load will try to get all the versions available
    (async () => {
      try {
        const dataflowId = graphRef.current.dataflowId;

        const response = await fetch(`/api/dataflowgraph/versions?dataflowId=${dataflowId}`, { headers: authHeader() });
        if (!response.ok) handleError(response);

        const data = await response.json(); //{ 'id', 'name','isLive','description', 'createdBy', 'createdAt' }[]
        setVersions(data);
      } catch (error) {
        console.log('Error fetch', error);
        message.error(error.message);
      }
    })();

    return () => notification.destroy();
  }, []);

  const saveVersion = async ({ name, description }) => {
    try {
      const dataflowId = graphRef.current.dataflowId;
      const wcGraph = getWorkingCopyGraph(dataflowId);
      if (!wcGraph) throw new Error('Failed to save Working Copy');

      setSaveGraph((prev) => ({ ...prev, loading: true, error: '' }));
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ graph: wcGraph, name, description, dataflowId }),
      };

      const response = await fetch('/api/dataflowgraph/save_versions', options);
      if (!response.ok) handleError(response);
      const result = await response.json(); // { id, name, isLive,  description, createdBy, createdAt}

      setVersions((prev) => [...prev, result]);
      closeSaveDialog();
      message.success(`Version "${name}" was saved`);
    } catch (error) {
      console.log(error);
      message.error(error.message);
      closeSaveDialog();
    }
  };

  const promptToSwitchVersion = (e, version) => {
    if (e) {
      // this is a hack to make version list close.
      e.stopPropagation();
      hideVersionsList();
    }
    confirm({
      width: '700px',
      title: `Would you like to switch to version "${version.name}" ?`,
      content: (
        <>
          <Alert
            type="warning"
            message={
              <Space direction="vertical">
                <Typography.Text type="danger" strong>
                  Working Copy will be replaced by version "{version.name}"
                </Typography.Text>
                <Typography.Text>
                  Please save your local changes before switching, otherwise they will be lost permanently
                </Typography.Text>
                <div style={{ marginTop: '5px', textAlign: 'end' }}>
                  <Button size="small" danger onClick={() => openSaveDialog()}>
                    Save Working Copy
                  </Button>
                </div>
              </Space>
            }
          />
          <Space align="start" style={{ marginTop: '15px' }}>
            <Typography.Text strong>Description:</Typography.Text>
            <Typography.Text style={{ maxWidth: '400px' }}>{version.description || 'None'}</Typography.Text>
          </Space>
        </>
      ),
      okText: 'Switch',
      onOk() {
        return switchVersion(version, true);
      },
      onCancel() {},
    });
  };

  // Passing isPermanent flag allows as to rewrite Working Copy or just show the clicked version in read-only view
  const switchVersion = async (version, isPermanent = false) => {
    try {
      const response = await fetch(`/api/dataflowgraph/change_versions?id=${version.id}`, { headers: authHeader() });
      if (!response.ok) handleError(response);

      const result = await response.json();
      graphRef.current
        .unfreeze()
        .enableSelection()
        .enableRubberband()
        .enableSnapline()
        .enableSharpSnapline()
        .hideTools();
      graphRef.current.fromJSON(result.graph);

      if (isPermanent) {
        const dataflowId = graphRef.current.dataflowId;
        const timestamp = new Date().toLocaleString();
        // Origin will be saved to LS and append to graph instance to show info about parent version
        const origin = {
          parent: result.name,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        result.graph.origin = origin;
        graphRef.current.origin = origin;

        // update localstorage

        saveWorkingCopyGraph(dataflowId, result.graph);

        // Notification API fives us control on timing and closing button.
        notification.success({
          message: `Version "${result.name}" is set as your Working Copy`,
          description: (
            <Space direction="vertical">
              <Typography.Text> Editing is enabled</Typography.Text>
              <Typography.Text>
                To make this version "LIVE" please save your changes and press
                <CaretRightOutlined component="span" style={{ verticalAlign: 0, margin: '0 3px' }} /> button in the
                versions list
              </Typography.Text>
            </Space>
          ),
          ...NOTIFICATION_CONF,
        });

        // Reset clicked version when done updating, empty id will show user that he is back on "Local Version"
        setClickedVersion({ id: '', name: '', description: '' });
      } else {
        // When change is not permanent we need to cancel most of the interactions to avoid editing graph.
        graphRef.current
          .freeze()
          .disableSelection()
          .disableRubberband()
          .disableSnapline()
          .disableSharpSnapline()
          .hideTools();

        // Only versions in DB can be executed, updated value will reflect in modal execute button;
        graphRef.current.dataflowVersionId = version.id;

        // Notify user about read-only view
        notification.info({
          message: `You are now on version "${result.name}"`,
          description: (
            <Space direction="vertical">
              <Typography.Text>
                You are in <Tag color="orange">Read-Only</Tag>mode.
              </Typography.Text>
              <Typography.Text>
                In Read-Only mode, you can click on assets and see descriptions but editing is disabled.
              </Typography.Text>
              <Typography.Text>
                To edit, click <CloudDownloadOutlined component="span" style={{ verticalAlign: 0, margin: '0 3px' }} />
                button on toolbar
              </Typography.Text>
            </Space>
          ),
          ...NOTIFICATION_CONF,
        });

        // keeping clicked version lets us show green badge next to selected branch
        setClickedVersion({ id: result.id, name: result.name, description: result.description });
      }

      // adjust graph view to fit newly pulled config.
      graphRef.current.zoomToFit({ maxScale: 1, padding: 20 }).centerContent();
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
    }
  };

  const hideVersionsList = () => {
    // Listdropdow needs to be closed manually if we want to add custom button to Menu.Item, call this method when u need to simulate list click.
    const list = document.querySelector('.versions_list');
    list.click();
  };

  const promptToRemove = (e, version) => {
    e.stopPropagation();
    hideVersionsList();
    confirm({
      title: `Are you sure you want to remove "${version.name}"?`,
      width: '700px',
      icon: <ExclamationCircleOutlined />,
      content: "Version will be removed permanently with all the version's graph settings",
      okText: 'Remove',
      okType: 'danger',
      onOk() {
        return removeVersion(version);
      },
      onCancel() {},
    });
  };

  const removeVersion = async (version) => {
    try {
      const options = {
        method: 'DELETE',
        headers: authHeader(),
      };

      const response = await fetch(`/api/dataflowgraph/remove_version?id=${version.id}`, options);
      if (!response.ok) handleError(response);

      const result = await response.json();
      if (!result.success) throw new Error('Failed to remove version!');

      setVersions((prev) => prev.filter((prevVersion) => prevVersion.id !== version.id));
      // if user is trying to delete version that is currently selected, we will need to get him to Local Version on success.
      if (version.id === clickedVersion.id) getWorkingCopy();
      closeSaveDialog();
      message.success(`"${version.name}" version was successfully removed!`);
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
    }
  };

  const editVersion = (e, version) => {
    e.stopPropagation();
    hideVersionsList();
    // will open editing/saving modal with inner Form for name and description
    setSaveGraph(() => ({ ...defaultDialog, visible: true, version }));
  };

  const saveEditedVersion = async ({ name, description, id }) => {
    try {
      const payload = {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ name, description, id }),
      };

      setSaveGraph((prev) => ({ ...prev, loading: true, error: '' }));

      const response = await fetch('/api/dataflowgraph/edit_version', payload);
      if (!response.ok) handleError(response);

      const version = await response.json(); // {id, name, description, createdBy, createdAt }

      setVersions((prev) =>
        prev.map((prevVersion) => {
          if (prevVersion.id === version.id) return { ...prevVersion, ...version };
          return prevVersion;
        })
      );

      closeSaveDialog();
      message.success(`"${version.name}" version saved!`);
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
      setSaveGraph((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const promptVersionLive = (e, action, version) => {
    e.stopPropagation();
    hideVersionsList();

    if (action === 'pause') {
      confirm({
        title: `Are you sure you want to stop dataflow version "${version.name}" execution?`,
        width: '700px',
        icon: <ExclamationCircleOutlined />,
        content: `"${version.name}" version will be stopped, schedule will be cleared.`,
        okText: 'Stop execution ',
        okType: 'danger',
        onOk() {
          return setVersionLive(version, action);
        },
        onCancel() {},
      });
    } else {
      confirm({
        title: `Are you sure you want to set version "${version.name}" as "LIVE"?`,
        width: '700px',
        icon: <ExclamationCircleOutlined />,
        content: `"${version.name}" version will be set as a primary dataflow version and start executing, previous "LIVE" version will be replaced.`,
        okText: 'Make LIVE',
        okType: 'danger',
        onOk() {
          return setVersionLive(version, action);
        },
        onCancel() {},
      });
    }
  };

  const setVersionLive = async (version, action) => {
    const dataflowId = graphRef.current.dataflowId;
    try {
      const payload = {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ id: version.id, action, dataflowId }),
      };

      const response = await fetch('/api/dataflowgraph/version_live', payload);
      if (!response.ok) handleError(response);

      const result = await response.json(); // { id, isLive }

      setVersions((prev) =>
        prev.map((version) => {
          if (version.id === result.id) return { ...version, ...result };
          return { ...version, isLive: false };
        })
      );

      closeSaveDialog();

      const active = `"${version.name}" is now "LIVE", and will be executed`;
      const paused = `"${version.name}" is paused, execution is discontinued`;

      notification.success({
        message: `"${version.name}" version got updated!`,
        description: action === 'pause' ? paused : active,
        ...NOTIFICATION_CONF,
      });
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
    }
  };

  const getWorkingCopy = () => {
    graphRef.current.dataflowVersionId = ''; // making sure you can not execute graph that is in localStorage
    const dataflowId = graphRef.current.dataflowId;
    const wcGraph = getWorkingCopyGraph(dataflowId);

    if (wcGraph) {
      // making sure that graph is not frozen and updates reflects on ui
      graphRef.current.unfreeze();
      graphRef.current.fromJSON(wcGraph);
    }

    // reset clicked version will show green badge on local version
    setClickedVersion({ id: '', name: '', description: '' });
    message.success('You are now on Working Copy');
  };

  const getBadge = (version) => {
    return version.id === clickedVersion.id ? <Badge color="green" /> : null;
  };

  const createMenuItem = (version) => {
    return (
      <Menu.Item className="graph-version-item" onClick={() => switchVersion(version, false)} key={version.id}>
        <Typography.Text style={{ display: 'block' }} strong>
          {getBadge(version)} {version.name}
        </Typography.Text>
        {/* Secondary line start */}
        <Space style={{ fontSize: '13px' }} size="small" split={<Divider type="vertical" />}>
          <Typography.Text type="secondary"> {new Date(version.createdAt).toLocaleString()}</Typography.Text>
          <Typography.Text type="secondary" copyable={{ text: version.createdBy, tooltips: false }}>
            {version.createdBy}
          </Typography.Text>

          <CloudDownloadOutlined onClick={(e) => promptToSwitchVersion(e, version)} />
          {/* we might want to check if user has permission to delete or edit and show it conditionaly */}
          <Space split={<Divider type="vertical" />}>
            <EditOutlined
              className="ant-typography-secondary"
              component="button"
              onClick={(e) => editVersion(e, version)}
            />
            <DeleteOutlined
              className="ant-typography-secondary"
              component="button"
              onClick={(e) => promptToRemove(e, version)}
            />
          </Space>

          {version.isLive ? (
            <>
              <PauseOutlined onClick={(e) => promptVersionLive(e, 'pause', version)} />
              <Typography.Text strong type="success">
                LIVE
              </Typography.Text>
            </>
          ) : (
            <CaretRightOutlined onClick={(e) => promptVersionLive(e, 'start', version)} />
          )}
        </Space>
        {/* Secondary line Finish */}
      </Menu.Item>
    );
  };

  const workingCopyData = (origin) => {
    return (
      <div>
        <Space split={<Divider type="vertical" />}>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            Created At: {origin.createdAt || ''}
          </Typography.Text>
          <Typography.Text style={{ display: 'block' }} type="secondary">
            Updated At: {origin.updatedAt || ''}
          </Typography.Text>
        </Space>
      </div>
    );
  };

  const getVersionsList = () => {
    if (versions.length === 0) {
      return (
        <Menu style={{ width: '200px' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Menu>
      );
    } else {
      const origin = graphRef.current.origin;
      return (
        <Menu>
          {versions.map((version, _index) => createMenuItem(version))}
          <Menu.Divider />
          <Menu.Item className="graph-version-item" onClick={getWorkingCopy}>
            <Space split={<Divider type="vertical" />}>
              <Typography.Text strong> {getBadge({ id: '' })} Working Copy</Typography.Text>
              {!origin.parent ? null : <Typography.Text type="secondary">Forked from: {origin.parent}</Typography.Text>}
            </Space>
            {workingCopyData(origin)}
          </Menu.Item>
        </Menu>
      );
    }
  };

  const openSaveDialog = () => setSaveGraph(() => ({ ...defaultDialog, visible: true }));
  const closeSaveDialog = () => setSaveGraph({ ...defaultDialog });

  return (
    <>
      <Item
        name="save"
        tooltip={t("Save graph version",{ns: 'dataflow'})}
        disabled={saveGraph.loading}
        active={saveGraph.loading}
        icon={saveGraph.loading ? <LoadingOutlined /> : <SaveOutlined />}
        onClick={openSaveDialog}>
        {saveGraph.loading ? t('...Saving',{ns: 'common'}) : t('Save Version',{ns: 'dataflow'})}
      </Item>
      <Item className="versions_list" name="versions" tooltip="Versions" dropdown={getVersionsList()} />
      {!clickedVersion.name ? (
        <Item name="current_version">
          <Badge color="#3bb44a" /> {t("You are on Working Copy", {ns: 'dataflow'})}
        </Item>
      ) : (
        <>
          <Item name="current_version" tooltip={clickedVersion.description}>
            <Badge color="#3bb44a" /> You are on version &quot{clickedVersion.name}&quot
          </Item>
          <Item
            name="switch"
            icon={<CloudDownloadOutlined />}
            tooltip={`Switch to version "${clickedVersion.name}"`}
            onClick={() => promptToSwitchVersion(null, clickedVersion)}
          />
          <Item
            name="return_to_working_copy"
            icon={<RollbackOutlined />}
            tooltip={'Go to "Working Copy"'}
            onClick={getWorkingCopy}
          />
        </>
      )}
      {!saveGraph.visible ? null : (
        <VersionForm
          onCreate={saveVersion}
          onEdit={saveEditedVersion}
          onCancel={closeSaveDialog}
          loading={saveGraph.loading}
          visible={saveGraph.visible}
          version={saveGraph.version}
        />
      )}
    </>
  );
};;

export default VersionsButton;

const VersionForm = ({ visible, loading, onCreate, onEdit, onCancel, version }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      version ? await onEdit({ ...values, id: version.id }) : await onCreate({ ...values });
      form.resetFields();
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  useEffect(() => {
    if (version) {
      form.setFieldsValue({ name: version.name, description: version.description });
    }
  }, []);

  return (
    <Modal
      visible={visible}
      destroyOnClose
      title={version ? `Editing version: "${version.name}"` : 'Create a new version'}
      okText={version ? 'Edit' : 'Create'}
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}>
      <Form form={form} layout="vertical" initialValues={{ name: '', description: '' }}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please provide title for version' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input type="textarea" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
