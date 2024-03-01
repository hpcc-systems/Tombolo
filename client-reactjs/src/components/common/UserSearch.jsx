import React, { useState } from 'react';
import { AutoComplete, Spin, Form, Select, Row, Col, Button, Input } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';

import { authHeader } from '../common/AuthHeader';
import Text, { i18n } from '../common/Text';

const { Option } = Select;

const groupedOption = (mainText, supportText) => {
  return (
    <div style={{ padding: '5px', borderBottom: '1px dotted lightgray' }}>
      <p style={{ marginBottom: '-5px', fontWeight: '600' }}>{mainText}</p>
      <p style={{ marginBottom: '0px', color: 'gray' }}>{supportText}</p>
    </div>
  );
};

function UserSearch({ layout, noLabelLayout, enableEdit, showDetails }) {
  const [searchingUser, setSearchingUser] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleUserSelection = (_user) => {
    setSearchResults([]);
  };

  // Search user
  const searchUser = debounce((value) => {
    if (value.length >= 3) {
      setSearchingUser(true);
      fetch('/api/user/searchuser', {
        method: 'get',
        headers: authHeader(),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          console.log(response);
          throw Error('Error occurred while looking up a user');
        })
        .then((data) => {
          console.log('<<<<< Data returned', data);
          setSearchResults(data);
        })
        .finally(() => {
          setSearchingUser(false);
        });
    }
  }, 400);

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
      ]}>
      {(fields, { add, remove }, { errors }) => {
        if (!enableEdit && !showDetails) return null;
        return (
          <>
            {fields.map((field, index) => (
              <Form.Item
                key={field.key}
                required={enableEdit}
                label={index === 0 ? <Text>Recipients</Text> : ''}
                labelAlign="left"
                {...(index === 0 ? layout : noLabelLayout)}
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
                <Row gutter={[8, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={21}>
                    <Form.Item
                      noStyle
                      {...field}
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
                      {enableEdit ? (
                        <AutoComplete
                          onSearch={searchUser}
                          notFoundContent={searchingUser ? <Spin /> : ''}
                          onSelect={handleUserSelection}
                          allowClear={true}
                          placeholder={i18n('E-mail')}>
                          {searchResults.map((result) => {
                            return <Option key={result.email}>{groupedOption(result.text, result.email)}</Option>;
                          })}
                        </AutoComplete>
                      ) : (
                        <Input className="read-only-input"></Input>
                      )}
                    </Form.Item>
                  </Col>
                  {enableEdit ? (
                    <Col span={3}>
                      <MinusCircleOutlined className="dynamic-delete-button" onClick={() => remove(field.name)} />
                    </Col>
                  ) : null}
                </Row>
              </Form.Item>
            ))}
            <Form.Item {...noLabelLayout}>
              {enableEdit ? (
                <Button onClick={() => add()} style={{ margin: '8px 0 8px' }} type="primary" ghost>
                  <Text>Add notification recipient</Text>
                </Button>
              ) : null}
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        );
      }}
    </Form.List>
  );
}

export default UserSearch;
