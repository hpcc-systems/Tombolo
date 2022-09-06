import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { hasEditPermission } from '../common/AuthUtil.js';
import ReactMarkdown from 'react-markdown';
import MonacoEditor from '../common/MonacoEditor.js';
import { Row, Col, Button, Form, Input, Select, Tabs, Spin, AutoComplete, message, Space } from 'antd';
import { authHeader, handleError } from '../common/AuthHeader.js';

import { debounce } from 'lodash';
import { useHistory } from 'react-router';

const TabPane = Tabs.TabPane;
const Option = Select.Option;

const formItemLayout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 8 },
};

const initSelectedFile = {
  id: '',
  url: '',
  name: '',
  title: '',
  cluster_id: '',
  description: '',
};

function VisualizationDetails() {
  const [authReducer, assetReducer, applicationReducer] = useSelector((state) => [
    state.authenticationReducer,
    state.assetReducer,
    state.applicationReducer,
  ]);
  const [form] = Form.useForm();
  const history = useHistory();
  const { t } = useTranslation(['common', 'common']);

  const [formState, setFormState] = useState({ enableEdit: true, dataAltered: false, loading: false });

  const [search, setSearch] = useState({ loading: false, error: '', data: [] });

  const [selectedFile, setSelectedFile] = useState({ ...initSelectedFile });

  const editingAllowed = hasEditPermission(authReducer.user);

  const handleCancel = () => history.push('/' + applicationReducer.application.applicationId + '/assets');

  const switchToViewOnly = () => setFormState((prev) => ({ ...prev, enableEdit: false, dataAltered: true }));

  const makeFieldsEditable = () => setFormState((prev) => ({ ...prev, enableEdit: true }));

  const onChange = () => setFormState((prev) => ({ ...prev, dataAltered: true }));

  const handleOk = async (e) => {
    e.preventDefault();
    try {
      await form.validateFields();
      setFormState((prev) => ({ ...prev, loading: true }));

      const options = {
        headers: authHeader(),
        method: 'POST',
        body: JSON.stringify({
          id: selectedFile.id,
          fileName: selectedFile.name,
          email: authReducer.user.email,
          editingAllowed: editingAllowed,
          clusterId: selectedFile.cluster_id,
          description: selectedFile.description,
          application_id: applicationReducer.application.applicationId,
          groupId: assetReducer.newAsset.groupId ? assetReducer.newAsset.groupId : '',
        }),
      };

      const response = await fetch('/api/file/read/visualization', options);
      if (!response.ok) handleError(response);

      const data = await response.json();

      if (data?.success) {
        history.push('/' + applicationReducer.application.applicationId + '/assets');
      } else {
        throw data;
      }
    } catch (error) {
      console.log('-error--handleOk---------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');

      message.error('Failed to get create visualization');
    }
    setFormState((prev) => ({ ...prev, loading: false }));
  };

  const clearState = () => {
    setSearch((prev) => ({ ...prev, data: [] }));
    setSelectedFile({ ...initSelectedFile });
    form.resetFields(['name', 'fileSearchValue']);
  };

  const searchFiles = useCallback(
    debounce(async (searchString) => {
      if (searchString.length <= 3) return;
      if (!searchString.match(/^[a-zA-Z0-9_ -]*$/)) {
        return message.error('Invalid search keyword. Please remove any special characters from the keyword.');
      }

      try {
        setSearch((prev) => ({ ...prev, loading: true, error: '' }));
        const options = {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({
            app_id: applicationReducer.application.applicationId,
            keyword: searchString.trim(),
          }),
        };

        const response = await fetch('/api/file/read/tomboloFileSearch', options);
        if (!response.ok) handleError(response);

        const suggestions = await response.json();
        setSearch((prev) => ({ prev, loading: false, data: suggestions }));
      } catch (error) {
        console.log('-error-----------------------------------------');
        console.dir({ error }, { depth: null });
        console.log('------------------------------------------');
        message.error('There was an error searching the files from cluster.');
        setSearch((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    }, 500),
    []
  );

  const onFileSelected = (fileName) => {
    const file = search.data.find((file) => file.name === fileName);
    setSelectedFile(file);
    form.setFieldsValue({ name: file.title });
  };

  const onChangeMD = (e) => {
    if (!formState.dataAltered) onChange();
    setSelectedFile((prev) => ({ ...prev, description: e.target.value }));
  };

  const controls = (
    <Space>
      {formState.enableEdit ? (
        <Button onClick={switchToViewOnly} disabled={!editingAllowed} type="primary" ghost>
          {t('View Changes', { ns: 'common' })}
        </Button>
      ) : (
        <Button type="primary" disabled={!editingAllowed} onClick={makeFieldsEditable}>
          {t('Edit', { ns: 'common' })}
        </Button>
      )}
      <Button onClick={handleCancel} type="primary" ghost style={{ marginLeft: '25px' }}>
        {t('Cancel', { ns: 'common' })}
      </Button>
      <Button
        type="primary"
        onClick={handleOk}
        disabled={!editingAllowed}
        loading={formState.confirmLoading}
        style={{ background: 'var(--success)' }}>
        {t('Save', { ns: 'common' })}
      </Button>
    </Space>
  );

  return (
    <React.Fragment>
      <Tabs defaultActiveKey="1" tabBarExtraContent={controls}>
        <TabPane tab={t('Basic', { ns: 'common' })} key="1">
          <Spin spinning={formState.loading}>
            <Form {...formItemLayout} labelAlign="left" form={form} onFinish={handleOk}>
              {!formState.enableEdit ? null : (
                <Form.Item label={t('File', { ns: 'common' })} name="fileSearchValue">
                  <Row gutter={[8, 0]}>
                    <Col span={19}>
                      <AutoComplete
                        className="certain-category-search"
                        dropdownClassName="certain-category-search-dropdown"
                        dropdownMatchSelectWidth={false}
                        dropdownStyle={{ width: 300 }}
                        style={{ width: '100%' }}
                        onSearch={(value) => searchFiles(value)}
                        onSelect={(value) => onFileSelected(value)}
                        placeholder={t('Search jobs', { ns: 'common' })}
                        disabled={!editingAllowed}
                        notFoundContent={search.loading ? <Spin /> : 'Not Found'}>
                        {search.data.map((suggestion) => (
                          <Option key={suggestion.id} value={suggestion.name}>
                            {suggestion.title}
                          </Option>
                        ))}
                      </AutoComplete>
                    </Col>
                    <Col span={5}>
                      <Button htmlType="button" block onClick={clearState}>
                        {t('Clear', { ns: 'common' })}
                      </Button>
                    </Col>
                  </Row>
                </Form.Item>
              )}

              <Form.Item
                label={t('Name', { ns: 'common' })}
                name="name"
                rules={[
                  { required: formState.enableEdit, message: 'Please enter a name!' },
                  { pattern: new RegExp(/^[a-zA-Z0-9:._ -]*$/), message: 'Please enter a valid name' },
                ]}>
                <Input
                  placeholder={t('Name', { ns: 'common' })}
                  onChange={onChange}
                  disabled={!editingAllowed}
                  className={!formState.enableEdit ? 'read-only-input' : ''}
                />
              </Form.Item>

              <Form.Item label={t('Description')}>
                {formState.enableEdit ? (
                  <MonacoEditor value={selectedFile.description} targetDomId="fileDescr" onChange={onChangeMD} />
                ) : (
                  <div className="read-only-markdown">
                    <ReactMarkdown source={selectedFile.description} />
                  </div>
                )}
              </Form.Item>
            </Form>
          </Spin>
        </TabPane>
      </Tabs>
    </React.Fragment>
  );
}

export default VisualizationDetails;
