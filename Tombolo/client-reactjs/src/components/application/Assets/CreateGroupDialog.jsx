import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';

import ReactMarkdown from 'react-markdown';
import MonacoEditor from '../../common/MonacoEditor.jsx';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { useSelector, useDispatch } from 'react-redux';
import { groupsExpanded } from '@/redux/slices/GroupSlice';
import Text from '../../common/Text';

export const CreateGroupDialog = ({ editGroup, applicationId, isShowing, toggle }) => {
  const { selectedKeys, expandedKeys } = useSelector((state) => state.groups);

  const dispatch = useDispatch();

  const initGroup = { name: '', description: '', id: '' };
  const [group, setGroup] = useState({ ...initGroup });

  const [readOnly, setReadOnly] = useState(true);

  const [form] = Form.useForm();

  const handleCreateGroup = async (_e) => {
    try {
      await form.validateFields();
      const isNew = group.id ? false : true;

      const options = {
        headers: authHeader(),
        method: 'POST',
        body: JSON.stringify({
          isNew: isNew,
          id: group.id,
          name: group.name,
          description: group.description,
          applicationId: applicationId,
          parentGroupId: isNew ? selectedKeys.id : '',
        }),
      };

      const response = await fetch('/api/groups', options);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to create group');
      }

      const data = await response.json();

      if (data?.success) {
        if (!expandedKeys.includes(selectedKeys.key)) {
          dispatch(groupsExpanded([...expandedKeys, selectedKeys.key]));
        }
        toggle({ saved: true });
      }
    } catch (error) {
      let errorMessage = error.message;
      if (error?.errorFields) errorMessage = error.errorFields[0].errors[0];
      message.error(errorMessage);
    }
  };

  useEffect(() => {
    (async () => {
      if (editGroup.edit) {
        try {
          const groupId = editGroup.groupId || selectedKeys.id;
          const url = `/api/groups/details?app_id=${applicationId}&group_id=${groupId}`;

          const response = await fetch(url, { headers: authHeader() });
          if (!response.ok) handleError(response);

          const data = await response.json();

          form.setFieldsValue({ name: data.name, description: data.description });
          setGroup({ name: data.name, description: data.description, id: data.id });
        } catch (error) {
          message.error(error.message);
          console.log(error);
        }
      } else {
        setReadOnly(false);
      }
    })();
  }, [editGroup]);

  const formInputChange = (e) => {
    e.persist(); // antd throws error if e.persis is not on
    setGroup((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = () => setReadOnly(false);

  //Layout for form
  const formItemLayout = {
    labelCol: {
      xs: { span: readOnly ? 3 : 2 },
      sm: { span: readOnly ? 5 : 8 },
    },
    wrapperCol: {
      xs: { span: 4 },
      sm: { span: 24 },
    },
  };

  return (
    <Modal
      title={<Text>Group</Text>}
      onCancel={toggle}
      open={isShowing}
      width={520}
      footer={
        <span>
          <Button type="primary" onClick={readOnly ? handleEdit : handleCreateGroup}>
            {readOnly ? <Text>Edit</Text> : <Text>Save</Text>}
          </Button>
          <Button type="primary" ghost onClick={toggle}>
            <Text>Cancel</Text>
          </Button>
        </span>
      }>
      <Form form={form} {...formItemLayout} className="formInModal" layout={readOnly ? 'horizontal' : 'vertical'}>
        <Form.Item
          label={<Text>Name</Text>}
          name="name"
          required={readOnly ? false : true}
          className={readOnly ? 'read-only-input' : ''}
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-zA-Z0-9_ -]*$/),
              message: 'Please enter a valid Name',
            },
          ]}>
          <Input id="name" name="name" placeholder={'Name'} onChange={formInputChange} />
        </Form.Item>

        <Form.Item label={<Text>Description</Text>} name="description">
          <span style={{ fontWeight: 'normal' }}>
            {readOnly ? (
              <ReactMarkdown className="read-only-markdown">{group.description}</ReactMarkdown>
            ) : (
              <MonacoEditor
                targetDomId="fileDescr"
                value={group.description}
                onChange={(e) => setGroup((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
              />
            )}
          </span>
        </Form.Item>
      </Form>
    </Modal>
  );
};
