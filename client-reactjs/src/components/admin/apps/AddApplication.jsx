import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Input, Radio, message } from "antd";
import {useDispatch } from "react-redux";

import { applicationActions } from '../../../redux/actions/Application';

import { authHeader } from "../../common/AuthHeader";

function AddApplication(props) {
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();

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
    if(props.isCreatingNewApp){
      const appWithSameTitleExists = props.applications.some(app => app.title ===  form.getFieldValue('title'));
      if(appWithSameTitleExists)  return message.error('App with same title already exists');
    }
    await form.validateFields();
    try {
      let payload = {
        ...form.getFieldsValue(),
        ...{ user_id: props.user.username, creator: props.user.username, id: props?.selectedApplication?.id || "" },
      };
      const response = await fetch("/api/app/read/saveApplication", {
        method: "post",
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) return message.error("Error occurred while saving application");
      message.success("Application saved successfully");
      const responseData = await response.json()
      if(props.isCreatingNewApp)dispatch(applicationActions.applicationSelected(responseData.id, responseData.title, responseData.title));
      localStorage.setItem("activeProjectId", responseData.id);
      form.resetFields();
      props.closeAddApplicationModal();
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
        title={props?.selectedApplication?.title || "Add new application"}
        maskClosable={false}
        onCancel={handleModalCancel}
        footer={props?.selectedApplication?.creator === props.user.username  || props.isCreatingNewApp? [
          <Button
            key="back"
            type="primary"
            onClick={props.isCreatingNewApp || isEditing ? saveApplication : () => setIsEditing(true)}
          >
            {props.isCreatingNewApp || isEditing ? "Save" : "Edit"}
          </Button>,
          <Button key="submit" type="primary" ghost onClick={handleModalCancel}>
            Cancel
          </Button>,
        ] : [ <Button key="submit" type="primary" ghost onClick={handleModalCancel}>
            Cancel
          </Button>]}
      >
        <Form className="formInModal" form={form}>
          <Form.Item
            {...formItemLayout}
            label="Title"
            name="title"
            rules={[
              {
                required: props.isCreatingNewApp || isEditing,
                message: "Title is required",
              },
              {
                pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/),
                message: "Invalid title",
              },
            ]}
          >
            <Input className={isEditing || props.isCreatingNewApp ? "" : "read-only-textarea"} />
          </Form.Item>

          <Form.Item label="Description" name="description" {...formItemLayout}>
            <TextArea
              autoSize={{ minRows: isEditing || props.isCreatingNewApp ? 4 : 1 }}
              className={isEditing || props.isCreatingNewApp ? "" : "read-only-textarea"}
            />
          </Form.Item>

          <Form.Item
            {...formItemLayout}
            label="Visibility"
            rules={[
              {
                required: props.isCreatingNewApp || isEditing,
                message: "Please select one",
              } ]}
            name="visibility"
          >
            {isEditing || props.isCreatingNewApp ? (
              <Radio.Group name="visibility">
                <Radio value={"Private"}>Private</Radio>
                <Radio value={"Public"}>Public</Radio>
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