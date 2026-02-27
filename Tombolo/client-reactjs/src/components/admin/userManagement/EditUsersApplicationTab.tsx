import React, { useEffect } from 'react';
import { Form, Select } from 'antd';
import { useSelector } from 'react-redux';
import type { FormInstance } from 'antd';

const { Option } = Select;

interface Props {
  userApplicationsForm: FormInstance;
  selectedUser: any;
  setUnsavedFields: (updater: (prev: any) => any) => void;
}

const EditUserApplicationsTab: React.FC<Props> = ({ userApplicationsForm, selectedUser, setUnsavedFields }) => {
  const allApps = useSelector((state: any) => state.application.applications);

  useEffect(() => {
    if (selectedUser && userApplicationsForm) {
      const existingApplications = selectedUser.applications.map((app: any) => app.application_id);
      userApplicationsForm.setFieldsValue({ applications: existingApplications });
    }
  }, [selectedUser, userApplicationsForm]);

  const onValuesChange = (changedValues: any, allValues: any) => {
    if (selectedUser) {
      const existingApplicationIds = selectedUser.applications.map((app: any) => app.application_id);
      const existingApplicationsString = existingApplicationIds.sort().join(',');

      Object.keys(changedValues).forEach(_key => {
        const currentApplicationsString = allValues.applications.sort().join(',');
        if (existingApplicationsString !== currentApplicationsString) {
          setUnsavedFields((prev: any) => ({ ...prev, applications: ['applications'] }));
        } else {
          setUnsavedFields((prev: any) => ({ ...prev, applications: [] }));
        }
      });
    }
  };

  return (
    <Form layout="vertical" form={userApplicationsForm} onValuesChange={onValuesChange}>
      <Form.Item
        label="Applications"
        name="applications"
        required
        rules={[{ required: true, message: 'Please select at least one application' }]}>
        <Select mode="tags">
          {allApps?.map((application: any) => (
            <Option key={application.id} value={application.id}>
              {application.title}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};

export default EditUserApplicationsTab;
