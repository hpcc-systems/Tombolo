import React from 'react';
import { Form, Button, Input, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const KeyForm = ({ createKey }) => {
  const [keyForm] = Form.useForm();
  const { TextArea } = Input;

  //save data
  const handleSave = async () => {
    try {
      //validate data and throw new error

      const data = await validateFields();

      if (data.validationError?.errorFields) {
        throw new Error('Validation failed, please check form fields again.');
      }

      createKey(data);
    } catch (err) {
      if (err.message !== 'Validation failed') message.error(err.message);
    }
  };

  //validate forms before saving
  const validateFields = async () => {
    let validationError = null;
    let formData = {};

    try {
      formData = await keyForm.validateFields();
    } catch (err) {
      validationError = err;
    }

    return { validationError, formData };
  };

  return (
    <Form form={keyForm} layout="vertical">
      <Form.Item label="Name" name="Name" required rules={[{ required: true, message: 'Required field' }]}>
        <Input placeholder="Name"></Input>
      </Form.Item>
      <Form.Item label="Notes" name="Notes">
        <TextArea rows={4} placeholder="250 Character Max" maxLength={250} />
      </Form.Item>
      <Form.List name="emails">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, _index) => (
              <Form.Item required={true} key={field.key}>
                <div style={{ display: 'flex', placeItems: 'center' }}>
                  <Form.Item
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
                    ]}
                    noStyle>
                    <Input placeholder="E-mail" />
                  </Form.Item>
                  {fields.length > 1 ? (
                    <MinusCircleOutlined
                      className="dynamic-delete-button"
                      onClick={() => remove(field.name)}
                      style={{ marginLeft: '10px' }}
                    />
                  ) : null}
                </div>
              </Form.Item>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                width={'100%'}
                style={{ width: '100% -10px' }}>
                Add Notification E-mail(s)
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Button key="save" type="primary" onClick={() => handleSave()}>
        Generate Key
      </Button>
    </Form>
  );
};

export default KeyForm;
