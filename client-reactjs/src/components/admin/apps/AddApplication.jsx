import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Radio, message } from 'antd';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { applicationActions } from '../../../redux/actions/Application';
import { emptyGroupTree } from '../../../redux/actions/Groups';
import { authHeader } from '../../common/AuthHeader';

import { useHistory } from 'react-router';

function AddApplication(props) {
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  const { t } = useTranslation(['common']); // t for translate -> getting namespaces relevant to this file

  // FORM ITEM LAYOUT
  const formItemLayout =
    isEditing || props.isCreatingNewApp
      ? {
          labelCol: {
            xs: { span: 24 },
          },
          wrapperCol: {
            xs: { span: 24 },
          },
        }
      : {
          labelCol: {
            xs: { span: 3 },
            sm: { span: 5 },
          },
          wrapperCol: {
            xs: { span: 4 },
            sm: { span: 24 },
          },
        };

  // IF isEditing AN APP - POPULATE APP DETAILS ON THE FORM WHEN THIS COMPONENT LOADS
  useEffect(() => {
    if (props.selectedApplication) {
      const { title, description, visibility } = props.selectedApplication;
      form.setFieldsValue({ title, description, visibility });
    }
  }, [props.selectedApplication]);

  // SAVE APPLICATION FUNCTION
  const saveApplication = async () => {
    if (props.isCreatingNewApp) {
      const appWithSameTitleExists = props.applications.some((app) => app.title === form.getFieldValue('title'));
      if (appWithSameTitleExists) return message.error('App with same title already exists');
    }
    await form.validateFields();
    try {
      let payload = {
        ...form.getFieldsValue(),
        user_id: props.user.username,
        creator: props.user.username,
        id: props?.selectedApplication?.id || '',
      };

      const response = await fetch('/api/app/read/saveApplication', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) return message.error('Error occurred while saving application');
      dispatch(emptyGroupTree());
      message.success('Application saved successfully');
      const responseData = await response.json();
      if (props.isCreatingNewApp)
        dispatch(applicationActions.applicationSelected(responseData.id, responseData.title, responseData.title));
      localStorage.setItem('activeProjectId', responseData.id);
      form.resetFields();
      props.closeAddApplicationModal();
      history.push(`/${responseData.id}/assets`);
    } catch (err) {
      console.log(err);
      message.error(err.message);
    }
  };

  // CANCEL / CLOSE MODAL WHEN CANCEL OR 'X' IS CLICKED
  const handleModalCancel = () => {
    props.closeAddApplicationModal();
    form.resetFields();
  };

  //JSX
  return (
    <Modal
      visible={props.showAddApplicationModal}
      title={props?.selectedApplication?.title || t('Add', { ns: 'common' })}
      maskClosable={false}
      onCancel={handleModalCancel}
      footer={
        props?.selectedApplication?.creator === props.user.username || props.isCreatingNewApp
          ? [
              <Button
                key="back"
                type="primary"
                onClick={props.isCreatingNewApp || isEditing ? saveApplication : () => setIsEditing(true)}>
                {props.isCreatingNewApp || isEditing ? t('Save', { ns: 'common' }) : t('Edit', { ns: 'common' })}
              </Button>,
              <Button key="submit" type="primary" ghost onClick={handleModalCancel}>
                {t('Cancel', { ns: 'common' })}
              </Button>,
            ]
          : [
              <Button key="submit" type="primary" ghost onClick={handleModalCancel}>
                Cancel
              </Button>,
            ]
      }>
      <Form className="formInModal" form={form} initialValues={{ visibility: 'Private' }}>
        <Form.Item
          {...formItemLayout}
          label={t('Title', { ns: 'common' })}
          name="title"
          rules={[
            {
              required: props.isCreatingNewApp || isEditing,
              message: 'Title is required',
            },
            {
              pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z0-9_: .-]*$/),
              message: 'Invalid title',
            },
          ]}>
          <Input className={isEditing || props.isCreatingNewApp ? '' : 'read-only-textarea'} />
        </Form.Item>

        <Form.Item label={t('Description', { ns: 'common' })} name="description" {...formItemLayout}>
          <TextArea
            autoSize={{ minRows: isEditing || props.isCreatingNewApp ? 4 : 1 }}
            className={isEditing || props.isCreatingNewApp ? '' : 'read-only-textarea'}
          />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={t('Visibility', { ns: 'common' })}
          rules={[
            {
              required: props.isCreatingNewApp || isEditing,
              message: 'Please select one',
            },
          ]}
          name="visibility">
          {isEditing || props.isCreatingNewApp ? (
            <Radio.Group name="visibility">
              <Radio value={'Private'}>{t('Private', { ns: 'common' })}</Radio>
              <Radio value={'Public'}>{t('Public', { ns: 'common' })}</Radio>
            </Radio.Group>
          ) : (
            <Input className="read-only-input" name="visibility" />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddApplication;
