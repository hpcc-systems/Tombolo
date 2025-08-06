import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Input, Radio, message, Card, Descriptions, Tooltip } from 'antd';
import { useDispatch } from 'react-redux';
import { applicationActions } from '../../../redux/actions/Application';
import { emptyGroupTree } from '../../../redux/actions/Groups';
import { authHeader } from '../../common/AuthHeader';
import Text from '../../common/Text';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../common/InfoDrawer';
import { setUser, getUser } from '../../common/userStorage';
import { Typography } from 'antd';
import dayjs from 'dayjs';
const { Text: AntText } = Typography;

// Description component for view mode
const AppDescription = ({ application }) => {
  const formatDate = (date) => (date ? dayjs(date).format('MMMM Do YYYY, h:mm:ss a') : 'N/A');

  return (
    <Descriptions bordered size="small" column={1}>
      <Descriptions.Item label="Title">
        <Text text={application.title} />
      </Descriptions.Item>
      <Descriptions.Item label="Description">
        <Text text={application.description || 'No description provided'} />
      </Descriptions.Item>
      <Descriptions.Item label="Visibility">
        <Text text={application.visibility} />
      </Descriptions.Item>
      <Descriptions.Item label="Creator">
        <AntText>
          <Tooltip title={application.application_creator.email} placement="top">
            <div className="link-text">
              {application.application_creator.firstName} {application.application_creator.lastName}
            </div>
          </Tooltip>
        </AntText>
      </Descriptions.Item>
      <Descriptions.Item label="Created At">
        <Text text={formatDate(application.createdAt)} />
      </Descriptions.Item>
      <Descriptions.Item label="Updated At">
        <Text text={formatDate(application.updatedAt)} />
      </Descriptions.Item>
    </Descriptions>
  );
};

// Form content for create/edit mode
const FormContent = ({ form, mode }) => {
  const { TextArea } = Input;
  const isEditable = mode === 'create' || mode === 'edit';
  const formItemLayout = {
    labelCol: { xs: { span: 24 } },
    wrapperCol: { xs: { span: 24 } },
  };

  return (
    <Card>
      <Form className="formInModal" form={form} initialValues={{ visibility: 'Private' }}>
        <Form.Item
          {...formItemLayout}
          label="Title"
          labelAlign="left"
          name="title"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: isEditable, message: 'Title is required' },
            { pattern: /^[a-zA-Z]{1}[a-zA-Z0-9_: .-]*$/, message: 'Invalid title' },
            { max: 256, message: 'Maximum of 256 characters allowed' },
          ]}>
          <Input disabled={!isEditable} className={!isEditable ? 'read-only-input' : ''} />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="Description"
          labelAlign="left"
          name="description"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: isEditable, message: 'Description is required' },
            { max: 1024, message: 'Maximum of 1024 characters allowed' },
          ]}>
          <TextArea
            autoSize={{ minRows: isEditable ? 4 : 1 }}
            disabled={!isEditable}
            className={!isEditable ? 'read-only-textarea' : ''}
          />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="Visibility"
          labelAlign="left"
          name="visibility"
          rules={[{ required: isEditable, message: 'Please select one' }]}>
          {isEditable ? (
            <Radio.Group name="visibility">
              <Radio value="Private">
                <Text text="Private" />
              </Radio>
              <Radio value="Public">
                <Text text="Public" />
              </Radio>
            </Radio.Group>
          ) : (
            <Input disabled className="read-only-input" />
          )}
        </Form.Item>
      </Form>
    </Card>
  );
};

function AddApplication({
  showAddApplicationModal,
  closeAddApplicationModal,
  mode,
  setMode,
  selectedApplication,
  user,
  applications,
}) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  // Populate form fields in edit mode
  useEffect(() => {
    if (selectedApplication && mode === 'edit') {
      const { title, description, visibility } = selectedApplication;
      form.setFieldsValue({ title, description, visibility });
    } else if (mode === 'create') {
      form.resetFields();
    }
  }, [selectedApplication, mode, form]);

  // Toggle InfoDrawer
  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  // Validate form fields
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

  // Save application
  const saveApplication = async () => {
    const appWithSameTitleExists = applications.some(
      (app) => app.title === form.getFieldValue('title') && app.id !== selectedApplication?.id
    );

    if (appWithSameTitleExists) {
      message.error('App with same title already exists');
      return;
    }

    const { validationError } = await validateForms();
    if (validationError) return;

    try {
      const fieldValues = form.getFieldsValue();
      const user = getUser();
      const payload = {
        ...fieldValues,
        id: selectedApplication?.id || '',
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
      closeAddApplicationModal();

      const responseData = await response.json();
      const { user_app_id, id, title, description } = responseData;
      user.applications.push({ id: user_app_id, application: { id, title, description } });
      setUser(JSON.stringify(user));

      dispatch(applicationActions.applicationSelected(id, title));
      localStorage.setItem('activeProjectId', responseData.id);
      dispatch(applicationActions.getApplications());
    } catch (err) {
      console.error(err);
      message.error(err.message);
    }
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    closeAddApplicationModal();
    form.resetFields();
  };

  // Determine if user can edit
  const canEdit = selectedApplication?.application_creator?.id === user.id;

  return (
    <Modal
      open={showAddApplicationModal}
      width={800}
      title={
        <>
          <Text text={selectedApplication?.title || 'Add Application'} />
          <InfoCircleOutlined style={{ marginLeft: '.5rem' }} onClick={showDrawer} />
        </>
      }
      maskClosable
      onCancel={handleModalCancel}
      footer={
        mode === 'view'
          ? canEdit
            ? [
                <Button key="edit" type="primary" onClick={() => setMode('edit')}>
                  <Text text="Edit" />
                </Button>,
              ]
            : null
          : [
              <Button key="save" type="primary" onClick={saveApplication}>
                <Text text={mode === 'create' ? 'Save' : 'Update'} />
              </Button>,
              <Button key="cancel" type="primary" ghost onClick={handleModalCancel}>
                <Text text="Cancel" />
              </Button>,
            ]
      }>
      {mode === 'view' && selectedApplication ? (
        <AppDescription application={selectedApplication} />
      ) : (
        <FormContent form={form} mode={mode} isEditable={mode === 'create' || mode === 'edit'} />
      )}
      <InfoDrawer open={open} onClose={onClose} content="application" />
    </Modal>
  );
}

export default AddApplication;
