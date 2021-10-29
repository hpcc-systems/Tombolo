import React from 'react';
import {Modal, Form, Input } from 'antd/lib';

function ManualJobDialog(props) {
    const [form] = Form.useForm();
    const { TextArea } = Input;
    const {modalVisible, onCancel} = props;

    //Handle cancel click func
    // const onCancel= () =>{
    //     console.log("on cancel clicked")
    // }

    //Handle save click func
    const onSave =() =>{
        console.log("on sve clicked")
    }

    return (
            <Modal
              visible={modalVisible}
              title="Enter details for notification"
              okText="Save"
              cancelText="Cancel"
              closable={false}
              onCancel={onCancel}
              onOk={() => {
                form
                  .validateFields()
                  .then((values) => {
                    form.resetFields();
                    onSave(values);
                  })
                  .catch((info) => {
                    console.log("Validate Failed:", info);
                  });
              }}
            >
              <Form
                form={form}
                layout="vertical"
                name="form_in_modal"
                initialValues={{
                  modifier: "public"
                }}
              >
                <Form.Item
                  name="email"
                  label="E-mail"
                  rules={[
                    {
                      required: true,
                      message: "Enter email address"
                    }
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="emailBody" 
                  label="Email Body"
                  rules={[
                    {
                      required: true,
                      message: "Enter email body"
                    }
                  ]}
                  >
                  <TextArea  
                  allowClear
                  rows={6} />
                </Form.Item>
              </Form>
            </Modal>
    )
}

export default ManualJobDialog
