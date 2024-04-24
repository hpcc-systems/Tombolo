import { Col, Form, Input, Row } from 'antd';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { threeColformItemLayout } from '../../../common/CommonUtil.js';
import Text, { i18n } from '../../../common/Text';
import MonacoEditor from '../../../common/MonacoEditor.js';

function BasicsTabScript({ enableEdit, editingAllowed, onChange, localState, inTabView }) {
  return (
    <React.Fragment>
      <Form.Item
        label={<Text>Name</Text>}
        name="name"
        validateTrigger="onBlur"
        rules={[{ required: true, message: 'Please enter a Name!', pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/) }]}>
        <Input
          id="job_name"
          onChange={onChange}
          placeholder={i18n('Name')}
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
          placeholder={i18n('Title')}
          disabled={!editingAllowed}
          className={enableEdit ? null : 'read-only-input'}
        />
      </Form.Item>

      <Form.Item label={<Text>Description</Text>} name="description">
        {enableEdit ? (
          <MonacoEditor
            onChange={onChange}
            value={localState.description}
            targetDomId={inTabView ? 'jobDescr' + inTabView.key : 'jobDescr'}
          />
        ) : (
          <div className="read-only-markdown">
            <ReactMarkdown source={localState.description} />
          </div>
        )}
      </Form.Item>

      <Row type="flex">
        <Col span={12} order={1}>
          <Form.Item
            {...threeColformItemLayout}
            label={<Text>Contact E-mail</Text>}
            name="contact"
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
              <Input
                id="job_bkp_svc"
                onChange={onChange}
                placeholder={i18n('Contact')}
                value={localState.contact}
                disabled={!editingAllowed}
              />
            ) : (
              <textarea className="read-only-textarea" />
            )}
          </Form.Item>
        </Col>
        <Col span={12} order={2}>
          <Form.Item
            label={<Text>Author</Text>}
            name="author"
            validateTrigger="onBlur"
            rules={[
              {
                pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                message: 'Please enter a valid author',
              },
            ]}>
            {enableEdit ? (
              <Input
                id="job_author"
                onChange={onChange}
                placeholder={i18n('Author')}
                value={localState.author}
                disabled={!editingAllowed}
              />
            ) : (
              <textarea className="read-only-textarea" />
            )}
          </Form.Item>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default BasicsTabScript;
