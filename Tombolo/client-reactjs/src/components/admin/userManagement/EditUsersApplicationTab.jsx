import React, { useEffect } from 'react';
import { Form, Select } from 'antd';
import { useSelector } from 'react-redux';

//Constants
const { Option } = Select;

function EditUserApplicationsTab({ userApplicationsForm, selectedUser, setUnsavedFields }) {
  // Get all applications from the redux store
  const { applications: allApps } = useSelector((state) => state.applicationReducer);

  // Pre-populate existing applications
  useEffect(() => {
    if (selectedUser && userApplicationsForm) {
      const existingApplications = selectedUser.applications.map((app) => app.application_id);
      userApplicationsForm.setFieldsValue({
        applications: existingApplications,
      });
    }
  }, [selectedUser, userApplicationsForm]);

  // Handle any from value changes - to keep track of unsaved fields
  const onValuesChange = (changedValues, allValues) => {
    // Compare changed value with selected user value
    if (selectedUser) {
      // Existing role ids
      const existingApplicationIds = selectedUser.applications.map((app) => app.application_id);
      const existingApplicationsString = existingApplicationIds.sort().join(',');

      Object.keys(changedValues).forEach((_key) => {
        const currentApplicationsString = allValues.applications.sort().join(',');
        if (existingApplicationsString !== currentApplicationsString) {
          setUnsavedFields((prev) => ({ ...prev, applications: ['applications'] }));
        } else {
          // Remove if change is reverted
          setUnsavedFields((prev) => ({ ...prev, applications: [] }));
        }
      });
    }
  };

  return (
    <Form layout="vertical" form={userApplicationsForm} onValuesChange={onValuesChange}>
      <Form.Item
        label="Applications"
        name="applications"
        required={true}
        rules={[
          {
            required: true,
            message: 'Please select at least one application',
          },
        ]}>
        <Select mode="tags">
          {allApps.map((application) => (
            <Option key={application.id} value={application.id}>
              {application.title}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
}

export default EditUserApplicationsTab;
