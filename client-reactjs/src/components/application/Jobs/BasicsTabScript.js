import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Row, Col } from 'antd/lib';
import ReactMarkdown from 'react-markdown';
import { MarkdownEditor } from "../../common/MarkdownEditor.js";
import { threeColformItemLayout } from "../../common/CommonUtil.js";

function BasicsTabScript({enableEdit, editingAllowed, onChange, localState, inTabView}) {
  return (    
    <React.Fragment>      
      <Form.Item label="Name" 
      name="name" 
      validateTrigger= "onBlur"
      rules={[{ required: true, message: 'Please enter a Name!', pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/) }]}>
        <Input
          id="job_name"
          onChange={onChange}
          placeholder="Name"
          disabled={!editingAllowed}
          className={enableEdit ? null : "read-only-input"} />
      </Form.Item>

      <Form.Item 
      label="Title" 
      name="title"
      validateTrigger= "onBlur"
      rules={[{ required: true, message: 'Please enter a title!' }, {
        pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
        message: 'Please enter a valid Title',
      }]}>
        <Input id="job_title"
          onChange={onChange}
          placeholder="Title"
          disabled={!editingAllowed}
          className={enableEdit? null : "read-only-input"}
        />
      </Form.Item>

      <Form.Item label="Description" name="description">
      {enableEdit ?
        <MarkdownEditor
        name="description"
        id="job_desc"
        onChange={onChange}
        targetDomId={ inTabView ? "jobDescr" + inTabView.key : "jobDescr"}
        value={localState.description}
        disabled={!editingAllowed}/>
        :
        <div className="read-only-markdown"> <ReactMarkdown source={localState.description} /></div>
      }

      </Form.Item>
      
      <Row type="flex">
        <Col span={12} order={1}>
        <Form.Item 
        {...threeColformItemLayout} 
        label="Contact Email" 
        name="contact"
        validateTrigger= "onBlur"
        rules={[{
            type: 'email',
            message: 'Please enter a valid email address',
        }]}>
            {enableEdit ?
            <Input id="job_bkp_svc"
            onChange={onChange}
            placeholder="Contact"
            value={localState.contact}
            disabled={!editingAllowed}
            />
            :
            <textarea className="read-only-textarea" />
        }
        </Form.Item>

        </Col>
        <Col span={12} order={2}>
        <Form.Item 
        label="Author:" 
        name="author" 
        validateTrigger= "onBlur"
        rules={[{
            pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
            message: 'Please enter a valid author',
        }]}>
        {enableEdit ?
            <Input
            id="job_author"
            onChange={onChange}
            placeholder="Author"
            value={localState.author}
            disabled={!editingAllowed}
            /> :
            <textarea className="read-only-textarea" />
        }
        </Form.Item>
        </Col>
      </Row>                        
    </React.Fragment>                
  )
}

export default BasicsTabScript