import React, {useEffect} from 'react';
import { Input, Row, Col } from 'antd';
import Form from 'antd/lib/form/Form';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authHeader } from "../../../common/AuthHeader";
import { message } from 'antd/lib';

//!! NOT IN USE
function GHCredentials({ enableEdit, form}) {

  useEffect(() => {
    (async()=>{
      try {
        const response = await fetch('/api/ghcredentials',{ headers: authHeader() });
        if (!response.ok) throw new Error("Not able to get credentials");        
        const result = await response.json();
        if (!result.credentials) return;
        form.current?.setFieldsValue({gitHubFiles:{ gitHubUserName: result.credentials.GHUsername, gitHubUserAccessToken: result.credentials.GHToken }});
      } catch (error) {
        console.log('-error-----------------------------------------');
        console.dir({error}, { depth: null });
        console.log('------------------------------------------');
        message.error(error.message)
      }
    })()
  }, [])

  const helperText = 'GitHub credentials are shared between all GitHub jobs, editing or deleting these fields will effect all GitHub jobs.';

  return (
    <Form.Item label='Credentials' help={helperText}>
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Form.Item
            name={['gitHubFiles', 'gitHubUserName']}
            validateTrigger={['onBlur', 'onSubmit']}
            className={!enableEdit && 'read-only-input'}
            rules={[
              ({ getFieldValue, setFields }) => ({
                validator: (field, value) => {
                  const token = getFieldValue(['gitHubFiles', 'gitHubUserAccessToken']);
                  if (!value && token) {
                    return Promise.reject(new Error('Provide Github Username'));
                  }
                  if (!value && !token) {
                    setFields([
                      { name: ['gitHubFiles', 'gitHubUserName'], errors: [] },
                      { name: ['gitHubFiles', 'gitHubUserAccessToken'], errors: [] },
                    ]);
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              autoComplete='new-password'
              allowClear
              prefix={<UserOutlined className='site-form-item-icon' />}
              placeholder='GitHub User Name'
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['gitHubFiles', 'gitHubUserAccessToken']}
            className={!enableEdit && 'read-only-input'}
            validateTrigger={['onBlur', 'onSubmit']}
            rules={[
              ({ getFieldValue, setFields }) => ({
                validator: (field, value) => {
                  const gitHubUserName = getFieldValue(['gitHubFiles', 'gitHubUserName']);
                  if (!value && gitHubUserName) {
                    return Promise.reject(new Error('Provide Github Access Token'));
                  }
                  if (!value && !gitHubUserName) {
                    setFields([
                      { name: ['gitHubFiles', 'gitHubUserName'], errors: [] },
                      { name: ['gitHubFiles', 'gitHubUserAccessToken'], errors: [] },
                    ]);
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              allowClear
              type='password'
              autoComplete='new-password'
              placeholder='Private Access Token'
              prefix={<LockOutlined className='site-form-item-icon' />}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form.Item>
  );
}

export default GHCredentials;
