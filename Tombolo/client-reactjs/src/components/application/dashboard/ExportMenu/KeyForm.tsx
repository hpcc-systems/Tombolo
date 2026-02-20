import React from 'react';
import { Form, Button, Input } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { handleError } from '@/components/common/handleResponse';
import { getUser } from '../../../common/userStorage';

interface Props {
  createKey: (data: any) => Promise<any>;
  authReducer?: any;
  key?: any;
}

const KeyForm: React.FC<Props> = ({ createKey }) => {
  const [keyForm] = Form.useForm();
  const { TextArea } = Input;

  const {
    user: { email },
  } = getUser();

  const validateFields = async () => {
    let validationError = null;
    let formData = {} as any;

    try {
      formData = await keyForm.validateFields();
    } catch (err) {
      validationError = err;
    }

    return { validationError, formData };
  };

  const handleSave = async () => {
    try {
      const data = await validateFields();

      if (data.validationError?.errorFields) {
        throw new Error('Validation failed, please check form fields again.');
      }

      createKey(data);
    } catch (err: any) {
      if (err.message !== 'Validation failed') handleError(err.message);
    }
  };

  return (
    <Form form={keyForm} layout="vertical">
      <Form.Item label="Name" name="Name" required rules={[{ required: true, message: 'Required field' }]}>
        <Input placeholder="Name"></Input>
      </Form.Item>
      <Form.Item label="Notes" name="Notes">
        <TextArea rows={2} placeholder="250 Character Max" maxLength={250} />
      </Form.Item>
      <Form.List name="emails">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, _index) => (
              <Form.Item required={true} key={field.key}>
                <div style={{ display: 'flex', placeItems: 'center' }}>
                  {field.key === 0 ? (
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[{ required: true, whitespace: true, type: 'email', message: 'Invalid e-mail address.' }]}
                      noStyle>
                      <Input defaultValue={email} />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[{ required: true, whitespace: true, type: 'email', message: 'Invalid e-mail address.' }]}
                      noStyle>
                      <Input placeholder="E-Mail" />
                    </Form.Item>
                  )}
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
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: '100%' }}>
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
