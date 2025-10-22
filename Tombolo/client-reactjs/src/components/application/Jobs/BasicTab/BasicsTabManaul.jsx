import { Col, Form, Input, Row, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDispatch, useSelector } from 'react-redux';
import MonacoEditor from '../../../common/MonacoEditor.jsx';
import Text from '../../../common/Text.jsx';
import LandingZoneFileExplorer from '../../../common/LandingZoneFileExplorer';
import { clusterSelected } from '@/redux/slices/AssetSlice';

function BasicsTabManul(props) {
  const { enableEdit, localState, editingAllowed, onChange, formRef, addingNewAsset, inTabView } = props;
  const storeClusterId = useSelector((state) => state.asset.clusterId);
  const storeClusters = useSelector((state) => state.application.clusters);
  const readOnlyView = !enableEdit || !addingNewAsset;

  // eslint-disable-next-line unused-imports/no-unused-vars
  const [landingZoneRootPath, setLandingZoneRootPath] = useState({ landingZonePath: '' });
  const [selectedCluster, setSelectedCluster] = useState(storeClusterId || localState.selectedCluster);
  const [clusters, _setClusters] = useState(storeClusters);
  const { Option } = Select;
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(landingZoneRootPath);
  }, []);

  // On form file path (cascader value) change
  const onFilePathChange = (value) => {
    formRef.current.setFieldsValue({ name: value[value.length - 1], title: value[value.length - 1] });
  };

  //When cluster is selected
  const onClusterSelection = (value) => {
    dispatch(clusterSelected(value));
    setSelectedCluster(value);
    localState.selectedCluster = value;
  };

  //Clear error when on focus
  const clearError = (e) => {
    formRef.current.setFields([
      {
        name: e.target.id,
        errors: [],
      },
    ]);
  };

  //Cascader initial value
  useEffect(() => {
    formRef.current.setFieldsValue({ manualJobFilePath: localState.job.manualJobFilePath });
  }, []);

  //JSX
  return (
    <>
      {enableEdit ? (
        <Form.Item label={<Text text="Cluster" />} hidden={readOnlyView}>
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item noStyle name="clusters">
                <Select disabled={!editingAllowed} onChange={onClusterSelection}>
                  {clusters.map((cluster) => (
                    <Option key={cluster.id}>{cluster.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
      ) : null}

      {localState.isNew || enableEdit ? (
        <LandingZoneFileExplorer
          clusterId={selectedCluster}
          DirectoryOnly={false}
          setLandingZoneRootPath={setLandingZoneRootPath}
          onDirectoryPathChange={onFilePathChange}
          enableEdit={enableEdit}
        />
      ) : null}

      <Form.Item
        label={<Text text="Name" />}
        name="name"
        validateTrigger="onBlur"
        onFocus={clearError}
        rules={[{ required: true, message: 'Please enter a Name!' }]}>
        <Input
          onChange={onChange}
          disabled={
            formRef.current.getFieldValue('path') && formRef.current.getFieldValue('path')?.length > 0 ? true : false
          }
          className={enableEdit ? null : 'read-only-input'}
        />
      </Form.Item>
      <Form.Item
        label={<Text text="Title" />}
        name="title"
        rules={[{ required: true, message: 'Please enter a title!' }]}
        onFocus={clearError}
        validateTrigger="onBlur">
        <Input onChange={onChange} disabled={!editingAllowed} className={enableEdit ? null : 'read-only-input'} />
      </Form.Item>
      <Form.Item label={<Text text="Description" />} name="description">
        {enableEdit ? (
          <MonacoEditor
            onChange={onChange}
            value={localState.description}
            targetDomId={inTabView ? 'jobDescr' + inTabView.key : 'jobDescr'}
          />
        ) : (
          <div className="read-only-markdown">
            <ReactMarkdown children={localState.job.description} />
          </div>
        )}
      </Form.Item>
      <Form.Item
        label={<Text text="Contact E-mail" />}
        name="contact"
        onFocus={clearError}
        validateTrigger={['onChange', 'onBlur']}
        type="email"
        rules={[
          {
            required: true,
            whitespace: true,
            type: 'email',
            message: 'Invalid e-mail address.',
          },
        ]}>
        <Input
          onChange={onChange}
          disabled={!editingAllowed}
          validateTrigger={['onChange', 'onBlur']}
          type="email"
          rules={[
            {
              required: true,
              whitespace: true,
              type: 'email',
              message: 'Invalid e-mail address.',
            },
          ]}
          className={enableEdit ? null : 'read-only-input'}
        />
      </Form.Item>
    </>
  );
}

export default BasicsTabManul;
