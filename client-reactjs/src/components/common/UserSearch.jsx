import React, {useState} from 'react'
import { AutoComplete, Spin, Form, Select, Row, Col, Button, Input } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';

import {authHeader} from '../common/AuthHeader'

const { Option } = Select;

const groupedOption = (mainText, supportText) =>{
    return (
        <div style={{padding: '5px', borderBottom: '1px dotted lightgray'}}>
            <p style={{marginBottom : '-5px', fontWeight: '600'}}>{mainText}</p>
            <p style={{ marginBottom : '0px', color: 'gray'}}>{supportText}</p>
        </div>
    )
}

function UserSearch({layout, noLabelLayout, enableEdit, showDetails}) {
    const [searchingUser, setSearchingUser] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const handleUserSelection = (user) =>{
        setSearchResults([]);
    }

  // Search user
  const searchUser =  debounce((value) =>{
      if(value.length >=3){
        setSearchingUser(true);
        fetch("/api/user/searchuser?searchTerm="+value, {
            method: 'get',
            headers: authHeader()
        }).then(response =>{
            if(response.ok){
                return response.json()
            }
            throw Error('Error occurred while looking up a user')
        }).then((data) =>{
            console.log('<<<<< Data returned', data)
            setSearchResults(data);
        }).finally(() =>{
            setSearchingUser(false)
        })
      }
  }, 400)

  return (
            <Form.List
              name="notificationRecipients"
              rules={[
                {
                  validator: async (_, names) => {
                    if (!names || names.length < 1) {
                      return Promise.reject(new Error('Add at least 1 Recipient'));
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => {
                if (!enableEdit && !showDetails) return null;
                return (
                  <>
                    {fields.map((field, index) => (
                      <Form.Item
                        key={field.key}
                        required={enableEdit}
                        label={index === 0 ? 'Recipients' : ''}
                        labelAlign='left'
                        validateTrigger={'onBlur'}
                        {...(index === 0 ? layout : noLabelLayout)}

                        rules={[
                          {
                            type: 'email',
                            required: true,
                            whitespace: true,
                            message: 'Please enter a valid email address',
                          },
                        ]}
                      >
                        <Row gutter={[8, 8]} style={{ marginBottom: '8px' }}>
                          <Col span={21}>
                            <Form.Item
                              noStyle
                              {...field}
                              validateTrigger={'onBlur'}
                              rules={[
                                {
                                  type: 'email',
                                  required: true,
                                  whitespace: true,
                                  message: 'Please enter a valid email address',
                                },
                              ]}
                            >
                              {enableEdit ? 
                              <AutoComplete
                                onSearch={searchUser}
                                notFoundContent={searchingUser ? <Spin />  : '' }
                                onSelect={handleUserSelection}
                                allowClear={true}
                                placeholder='Start typing name or email address'
                              >
                                {searchResults.map((result) => {
                                  return <Option key={result.email}>{groupedOption(result.text, result.email)}</Option>;
                                })}

                              </AutoComplete>:
                              <Input className="read-only-input"></Input>
                                  }
                            </Form.Item>
                          </Col>
                          {enableEdit ? 
                          <Col span={3}>
                            <MinusCircleOutlined className="dynamic-delete-button" onClick={() => remove(field.name)} />
                          </Col>: null}
                        </Row>
                      </Form.Item>
                    ))}
                    <Form.Item 
                      {...noLabelLayout}
                      >
                      {enableEdit ? 
                      <Button type="dashed" onClick={() => add()} style={{ margin: '8px 0 8px' }} type='primary' ghost>
                        Add notification recipient
                      </Button> : null}
                      <Form.ErrorList errors={errors} />
                    </Form.Item>
                  </>
                );
              }}
            </Form.List>
  )
}

export default UserSearch