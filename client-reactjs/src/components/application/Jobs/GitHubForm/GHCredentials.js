import React from 'react'
import { Input, Row, Col } from "antd";
import Form from "antd/lib/form/Form";
import { UserOutlined, LockOutlined } from '@ant-design/icons';

function GHCredentials({enableEdit}) {

  const helperText ="GitHub credentials are not required for public repos, although they are usually autofilled by your browser, please check inputs."
    return (
      <Form.Item label="Credentials" help={helperText}> 
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Form.Item 
              name={["gitHubFiles", "gitHubUserName"]}
              validateTrigger={["onBlur", "onSubmit"]}
              className={!enableEdit && "read-only-input"}
              rules={[
                ({ getFieldValue, setFields }) => ({
                  validator: (field, value) => {
                    const token = getFieldValue(["gitHubFiles", "gitHubUserAccessToken"])
                    if (!value && token) {
                      return Promise.reject(new Error("Provide Github Username"));
                    }
                    if (!value && !token){
                      setFields([{name:["gitHubFiles", "gitHubUserName"],errors:[]}, {name:["gitHubFiles", "gitHubUserAccessToken"],errors:[]}])
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input autoComplete="new-password" allowClear prefix={<UserOutlined className="site-form-item-icon" />} placeholder="GitHub User Name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
            name={["gitHubFiles", "gitHubUserAccessToken"]}
            className={!enableEdit && "read-only-input"}
            validateTrigger={["onBlur", "onSubmit"]}
            rules={[      
              ({ getFieldValue,setFields }) => ({
                validator: (field, value) => {
                  const gitHubUserName = getFieldValue(["gitHubFiles", "gitHubUserName"]);
                  if (!value && gitHubUserName) {
                    return Promise.reject(new Error("Provide Github Access Token"));
                  }
                  if (!value && !gitHubUserName){
                    setFields([{name:["gitHubFiles", "gitHubUserName"],errors:[]}, {name:["gitHubFiles", "gitHubUserAccessToken"],errors:[]}])
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            >
              <Input autoComplete="new-password" allowClear prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder="Private Access Token" />
            </Form.Item>
          </Col>
       </Row>
      </Form.Item>
    )
}

export default GHCredentials
