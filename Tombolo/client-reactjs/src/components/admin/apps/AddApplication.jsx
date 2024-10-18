import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Radio, message } from 'antd';
import { useDispatch } from 'react-redux';
import { applicationActions } from '../../../redux/actions/Application';
import { emptyGroupTree } from '../../../redux/actions/Groups';
import { authHeader } from '../../common/AuthHeader';
import Text from '../../common/Text';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../common/InfoDrawer';

function AddApplication(props) {
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

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
    const appWithSameTitleExists = props.applications.some((app) => app.title === form.getFieldValue('title'));

    if (appWithSameTitleExists) {
      message.error('App with same title already exists');
      return;
    }
    await validateForms();

    try {
      const fieldValues = form.getFieldsValue();

      const user = JSON.parse(localStorage.getItem('user'));

      let payload = {
        ...fieldValues,
        user_id: user.id,
        creator: user.id,
        id: props?.selectedApplication?.id || '',
      };

      const response = await fetch('/api/app/read/saveApplication', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        message.error('Error occurred while saving application');
        return;
      }
      dispatch(emptyGroupTree());
      message.success('Application saved successfully');
      form.resetFields();
      props.closeAddApplicationModal();

      const responseData = await response.json();

      //add application to user object in local storage so user has immediate access to it
      const { user_app_id, id, title, description } = responseData;
      user.applications.push({ id: user_app_id, application: { id, title, description } });
      await localStorage.setItem('user', JSON.stringify(user));

      dispatch(applicationActions.applicationSelected(id, title));
      localStorage.setItem('activeProjectId', responseData.id);

      dispatch(applicationActions.getApplications());

      if (isEditing) {
        const updatedApplications = props.applications.map((application) => {
          if (application.id === props.selectedApplication.id) {
            return { ...application, fieldValues };
          } else {
            return application;
          }
        });

        dispatch(applicationActions.getApplications());
        updatedApplications;
      }
    } catch (err) {
      console.log(err);
      message.error(err.message);
    }
  };

  //validate forms before saving
  const validateForms = async () => {
    let validationError = null;
    let formData = {};

    try {
      formData = await form.validateFields();
    } catch (err) {
      validationError = err;
    }

    return { validationError, formData };
  };

  // CANCEL / CLOSE MODAL WHEN CANCEL OR 'X' IS CLICKED
  const handleModalCancel = () => {
    props.closeAddApplicationModal();
    form.resetFields();
  };

  //JSX
  return (
    <Modal
      open={props.showAddApplicationModal}
      title={
        props?.selectedApplication?.title ? (
          <>
            <Text text={props?.selectedApplication?.title} />
            <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={() => showDrawer()}></InfoCircleOutlined>
          </>
        ) : (
          <>
            <Text text="Add Application" />
            <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={() => showDrawer()}></InfoCircleOutlined>
          </>
        )
      }
      maskClosable={false}
      onCancel={handleModalCancel}
      footer={
        props?.selectedApplication?.creator === props.user.username || props.isCreatingNewApp
          ? [
              <Button key="back" type="primary" onClick={!isEditing ? saveApplication : () => setIsEditing(true)}>
                {!isEditing ? <Text text="Save" /> : <Text text="Edit" />}
              </Button>,
              <Button key="submit" type="primary" ghost onClick={handleModalCancel}>
                {<Text text="Cancel" />}
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
          label="Title"
          labelAlign="left"
          name="title"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            {
              required: props.isCreatingNewApp || isEditing,
              message: 'Title is required',
            },
            {
              pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z0-9_: .-]*$/),
              message: 'Invalid title',
            },
            {
              max: 256,
              message: 'Maximum of 256 characters allowed',
            },
          ]}>
          <Input className={isEditing || props.isCreatingNewApp ? '' : 'read-only-textarea'} />
        </Form.Item>

        <Form.Item
          label="Description"
          labelAlign="left"
          name="description"
          {...formItemLayout}
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            {
              required: props.isCreatingNewApp || isEditing,
              message: 'Title is required',
            },
            {
              pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z0-9_: .-]*$/),
              message: 'Invalid title',
            },
            {
              max: 1024,
              message: 'Maximum of 1024 characters allowed',
            },
          ]}>
          <TextArea
            autoSize={{ minRows: isEditing || props.isCreatingNewApp ? 4 : 1 }}
            className={isEditing || props.isCreatingNewApp ? '' : 'read-only-textarea'}
          />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label="Visibility"
          labelAlign="left"
          rules={[
            {
              required: props.isCreatingNewApp || isEditing,
              message: 'Please select one',
            },
          ]}
          name="visibility">
          {isEditing || props.isCreatingNewApp ? (
            <Radio.Group name="visibility">
              <Radio value={'Private'}>{<Text text="Private" />}</Radio>
              <Radio value={'Public'}>{<Text text="Public" />}</Radio>
            </Radio.Group>
          ) : (
            <Input className="read-only-input" name="visibility" />
          )}
        </Form.Item>
      </Form>
      <InfoDrawer open={open} onClose={onClose} content="application"></InfoDrawer>
    </Modal>
  );
}

export default AddApplication;
