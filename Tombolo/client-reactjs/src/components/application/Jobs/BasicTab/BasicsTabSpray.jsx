import { Button, Col, Form, Input, message, Row, Select, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authHeader, handleError } from '../../../common/AuthHeader';
import { formItemLayout } from '../../../common/CommonUtil';
import Text from '../../../common/Text';
import { clusterSelected } from '@/redux/slices/AssetSlice';
const { Option, OptGroup } = Select;

function BasicsTabSpray({
  enableEdit,
  editingAllowed,
  addingNewAsset,
  clearState,
  onChange,
  clusters,
  localState,
  formRef,
}) {
  const storeClusterId = useSelector((state) => state.asset.clusterId);
  const [selectedCluster, setSelectedCluster] = useState(storeClusterId);
  const [jobSearchErrorShown, setJobSearchErrorShown] = useState(false);
  const [searchResultsLoaded, setSearchResultsLoaded] = useState(false);
  const [dropZoneFileSearchSuggestions, setDropZoneFileSearchSuggestions] = useState([]);
  const [dropZones, setDropZones] = useState({});
  const [selectedDropZoneName, setSelectedDropZoneName] = useState('');
  const [selectedDropZoneIP, setSelectedDropZoneIP] = useState('');
  const [sprayedFileScope, _setSprayedFileScope] = useState('');
  const [sprayFileName, setSprayFileName] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    getDropZones(selectedCluster || localState.selectedCluster);
  }, [selectedCluster, localState.selectedCluster]);

  const onDropZoneFileChange = (value) => {
    setSprayFileName(value);
    localState.job.sprayFileName = value;
  };

  const onClusterSelection = (value) => {
    dispatch(clusterSelected(value));
    setSelectedCluster(value);
    getDropZones(value);
    setSelectedDropZoneIP('');
    setSelectedDropZoneName('');
    formRef.current.setFieldsValue({
      ...formRef.current.getFieldsValue(),
      sprayDropZone: '',
    });
  };

  const getDropZones = (clusterId) => {
    if (clusterId) {
      fetch('/api/hpcc/read/getDropZones?clusterId=' + clusterId, {
        headers: authHeader(),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then((dropZones) => {
          setDropZones(dropZones);
          if (formRef && formRef.current && formRef.current.getFieldValue('sprayDropZone')) {
            Object.keys(dropZones).forEach((dropZone) => {
              if (dropZones[dropZone].includes(formRef.current.getFieldValue('sprayDropZone'))) {
                setSelectedDropZoneIP(formRef.current.getFieldValue('sprayDropZone'));
              }
            });
          }
        });
    }
  };

  const searchDropZoneFiles = (searchString) => {
    if (searchString.length <= 3 || jobSearchErrorShown) {
      return;
    }
    setJobSearchErrorShown(false);
    setSearchResultsLoaded(false);

    var data = JSON.stringify({
      clusterId: selectedCluster,
      dropZoneName: selectedDropZoneName,
      nameFilter: searchString,
      server: selectedDropZoneIP,
    });
    fetch('/api/hpcc/read/dropZoneFileSearch', {
      method: 'post',
      headers: authHeader(),
      body: data,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then((suggestions) => {
        setDropZoneFileSearchSuggestions(suggestions);
        setSearchResultsLoaded(true);
      })
      .catch((error) => {
        if (!jobSearchErrorShown) {
          error.json().then((_body) => {
            message.config({ top: 130 });
            message.error('There was an error searching the files from cluster');
          });
          setJobSearchErrorShown(true);
        }
      });
  };

  const onDropZoneChange = (e) => {
    setSelectedDropZoneIP(e);
    Object.keys(dropZones).filter((dropZone) => {
      if (dropZones[dropZone].includes(e)) {
        setSelectedDropZoneName(dropZone);
      }
    });
  };

  return (
    <React.Fragment>
      {addingNewAsset ? (
        <Form.Item {...formItemLayout} label={<Text>Cluster</Text>} name="clusters">
          <Select
            placeholder={'Select a Cluster'}
            disabled={!editingAllowed}
            onChange={onClusterSelection}
            style={{ width: 190 }}>
            {clusters.map((cluster) => (
              <Option key={cluster.id}>{cluster.name}</Option>
            ))}
          </Select>
        </Form.Item>
      ) : null}
      <Form.Item label={<Text>Dropzone</Text>} name="sprayDropZone">
        {enableEdit ? (
          <Select
            placeholder={'Drop Zone'}
            style={{ width: 190 }}
            defaultValue={selectedDropZoneName}
            onChange={onDropZoneChange}
            disabled={!editingAllowed}>
            {Object.keys(dropZones).map((d, index) => (
              <OptGroup key={index} label={d}>
                {dropZones[d].map((dropZone) => (
                  <Option value={dropZone} key={dropZone}>
                    {dropZone}
                  </Option>
                ))}
              </OptGroup>
            ))}
          </Select>
        ) : (
          <textarea className="read-only-textarea" />
        )}
      </Form.Item>
      <Form.Item
        label={<Text>Name</Text>}
        name="name"
        validateTrigger="onBlur"
        rules={[{ required: true, message: 'Please enter a Name!', pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/) }]}>
        <Input
          id="job_name"
          onChange={onChange}
          placeholder={'Name'}
          disabled={!editingAllowed}
          className={enableEdit ? null : 'read-only-input'}
        />
      </Form.Item>

      <Form.Item
        label={<Text>Title</Text>}
        name="title"
        validateTrigger="onBlur"
        rules={[
          { required: true, message: 'Please enter a title!' },
          {
            pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
            message: 'Please enter a valid Title',
          },
        ]}>
        <Input
          id="job_title"
          onChange={onChange}
          placeholder={'Title'}
          disabled={!editingAllowed}
          className={enableEdit ? null : 'read-only-input'}
        />
      </Form.Item>

      <Form.Item label={<Text>File</Text>} name="sprayFileName">
        {addingNewAsset ? (
          <Row type="flex">
            <Col span={21} order={1}>
              <Select
                showSearch
                value={sprayFileName}
                placeholder={'Search dropzone files'}
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                onSearch={searchDropZoneFiles}
                onChange={onDropZoneFileChange}
                notFoundContent={searchResultsLoaded ? 'Not Found' : <Spin />}>
                {dropZoneFileSearchSuggestions.map((suggestion) => (
                  <Option key={suggestion.name} value={suggestion.name}>
                    {suggestion.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={3} order={2} style={{ paddingLeft: '3px' }}>
              <Button htmlType="button" onClick={clearState}>
                <Text>Clear</Text>
              </Button>
            </Col>
          </Row>
        ) : (
          <textarea className="read-only-textarea" />
        )}
      </Form.Item>

      <Form.Item label={<Text>Scope</Text>} name="sprayedFileScope">
        {enableEdit ? (
          <Input
            id="sprayedFileScope"
            onChange={onChange}
            placeholder={'Scope'}
            value={sprayedFileScope}
            disabled={!editingAllowed}
          />
        ) : (
          <textarea className="read-only-textarea" />
        )}
      </Form.Item>
    </React.Fragment>
  );
}

export default BasicsTabSpray;
