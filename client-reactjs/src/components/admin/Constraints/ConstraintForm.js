import { Form, Input, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authHeader, handleError } from '../../common/AuthHeader';
import MonacoEditor from '../../common/MonacoEditor';

import { applicationActions } from '../../../redux/actions/Application';

const ConstraintForm = ({ modal, onClose }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);
  const dispatch = useDispatch();

  const [form] = Form.useForm();

  const [sending, setSending] = useState({ loading: false, success: false, error: '' });

  useEffect(() => {
    if (modal.constraint) form.setFieldsValue(modal.constraint);

    return () => form.resetFields();
  }, [modal.isOpen]);

  const getOKtext = () => (modal.constraint ? 'Edit' : 'Add');

  const handleOk = async () => {
    try {
      const fields = await form.validateFields();
      // modal.constraint ? await onEdit({ ...modal.constraint, ...fields }) : await onCreate(fields);
      await sendConstaint(fields);
    } catch (error) {
      console.log('error', error);
      message.error('Please check your inputs');
    }
  };

  const sendConstaint = async (fields) => {
    const constraint = modal.constraint ? { ...modal.constraint, ...fields } : fields;
    const isEditing = !!modal.constraint;

    try {
      const config = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(constraint),
      };

      setSending((prev) => ({ ...prev, loading: true, error: '', success: false }));

      const response = await fetch('/api/constraint', config);
      if (!response.ok) handleError(response);

      setSending((prev) => ({ ...prev, loading: false, success: true }));
      const data = await response.json();

      const newConstraints = isEditing
        ? constraints.map((el) => (el.id == data.id ? data : el))
        : [data, ...constraints];

      dispatch(applicationActions.updateConstraints(newConstraints));

      message.success('Success');
      onClose();
    } catch (error) {
      setSending((prev) => ({ ...prev, loading: false, success: false, error: error.message }));
      console.log('Error fetch', error);
      message.error(error.message);
    }
  };

  if (!modal.isOpen) return null;

  return (
    <Modal
      destroyOnClose
      onOk={handleOk}
      onCancel={onClose}
      okText={getOKtext()}
      visible={modal.isOpen}
      confirmLoading={sending.loading}>
      <Form layout="vertical" form={form}>
        <Form.Item label="Constraint name" name="name" required>
          <Input />
        </Form.Item>
        <Form.Item label="Source" name="source">
          <Input />
        </Form.Item>
        <Form.Item label="Scope" name="scope">
          <Input />
        </Form.Item>
        <Form.Item label="Permissible purposes" name="permissible_purposes">
          <Input />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <MonacoEditor lang="markdown" targetDomId="constarint" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConstraintForm;
