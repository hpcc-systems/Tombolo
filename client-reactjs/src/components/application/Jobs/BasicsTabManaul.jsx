import React, { useState, useEffect } from 'react';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { Col, Form, Input, Row, Select, Cascader } from 'antd';
import ReactMarkdown from 'react-markdown';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import MonacoEditor from '../../common/MonacoEditor.js';
import { assetsActions } from '../../../redux/actions/Assets';

function BasicsTabManul(props) {
  const { enableEdit, localState, editingAllowed, onChange, formRef, addingNewAsset, inTabView } = props;
  const assetReducer = useSelector((state) => state.assetReducer);
  const applicationReducer = useSelector((state) => state.applicationReducer);
  const readOnlyView = !enableEdit || !addingNewAsset;
  const [options, setOptions] = useState([]);
  const { t } = useTranslation(['common', 'clusters']); // t for translate -> getting namespaces relevant to this file

  const [selectedCluster, setSelectedCluster] = useState(assetReducer.clusterId || localState.selectedCluster);
  const [clusters, _setClusters] = useState(applicationReducer.clusters);
  const { Option } = Select;
  const dispatch = useDispatch();

  // On form file path (cascader value) change
  const onFilePathChange = (value) => {
    formRef.current.setFieldsValue({ name: value[value.length - 1], title: value[value.length - 1] });
  };

  //When cluster is selected
  const onClusterSelection = (value) => {
    dispatch(assetsActions.clusterSelected(value));
    setSelectedCluster(value);
    localState.selectedCluster = value;
  };

  //When the cluster id changes make a call and get all dropzones within that cluster
  useEffect(() => {
    if (selectedCluster) {
      fetch(`/api/hpcc/read/getDropzones?clusterId=${selectedCluster}&for=manualJobSerach`, {
        headers: authHeader(),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then((data) => {
          let newOptions = [];
          data.map((item) => {
            newOptions.push({ value: item.path, label: item.name, machine: item.machines[0], isLeaf: false });
          });
          setOptions(newOptions);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [selectedCluster]);

  //Clear error when on focus
  const clearError = (e) => {
    formRef.current.setFields([
      {
        name: e.target.id,
        errors: [],
      },
    ]);
  };

  //when dropzone is selected make call to get the dirs and files
  const loadData = (selectedOptions) => {
    const pathToAsset = selectedOptions.map((item) => item.value).join('/') + '/'; // join options array with "/" to create a path
    const host = clusters.filter((item) => item.id === selectedCluster);
    const targetOption = selectedOptions[selectedOptions.length - 1];

    targetOption.loading = true;
    const data = JSON.stringify({
      Netaddr: selectedOptions[0].machine.Netaddress,
      Path: pathToAsset,
      OS: selectedOptions[0].OS,
      rawxml_: true,
      DirectoryOnly: false,
    });
    fetch(
      `/api/hpcc/read/getDirectories?data=${data}&host=${host[0].thor_host}&port=${host[0].thor_port}&clusterId=${selectedCluster}`,
      {
        headers: authHeader(),
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        if (data.FileListResponse.files) {
          let children = [];
          data.FileListResponse.files.PhysicalFileStruct.map((item) => {
            let child = {};
            child.value = item.name;
            child.label = item.name;
            child.isLeaf = !item.isDir;
            children.push(child);
          });

          //Sort the result so the dirs are always on top
          children.sort(function (a, b) {
            if (a.isLeaf < b.isLeaf) {
              return -1;
            }
          });
          targetOption.loading = false;
          targetOption.children = children;
          setOptions([...options]);
        } else {
          targetOption.loading = false;
          targetOption.disabled = true;
          targetOption.children = [];
          setOptions([...options]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //Cascader initial value
  useEffect(() => {
    formRef.current.setFieldsValue({ manualJobFilePath: localState.job.manualJobFilePath });
  }, []);

  //JSX
  return (
    <>
      {enableEdit ? (
        <Form.Item label={t('Cluster', { ns: 'common' })} hidden={readOnlyView}>
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
        <Form.Item label={t('File Path', { ns: 'job' })} name="manualJobFilePath">
          <Cascader
            options={options}
            onChange={onFilePathChange}
            loadData={loadData}
            className={enableEdit ? null : 'read-only-input'}
            allowClear
          />
        </Form.Item>
      ) : null}

      <Form.Item
        label={t('Name', { ns: 'common' })}
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
        label={t('Title', { ns: 'common' })}
        name="title"
        rules={[{ required: true, message: 'Please enter a title!' }]}
        onFocus={clearError}
        validateTrigger="onBlur">
        <Input onChange={onChange} disabled={!editingAllowed} className={enableEdit ? null : 'read-only-input'} />
      </Form.Item>

      <Form.Item label={t('Description', { ns: 'common' })} name="description">
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
        label={t('Contact E-mail', { ns: 'common' })}
        name="contact"
        validateTrigger="onBlur"
        onFocus={clearError}
        rules={[{ type: 'email', required: true, message: t('Please enter a valid email address', { ns: 'common' }) }]}>
        <Input onChange={onChange} disabled={!editingAllowed} className={enableEdit ? null : 'read-only-input'} />
      </Form.Item>
    </>
  );
}

export default BasicsTabManul;
