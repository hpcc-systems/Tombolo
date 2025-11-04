// Imports from libraries
import React, { useEffect } from 'react';
import { Card, Form, Select } from 'antd';

const { Option } = Select;

function EditUserRolesTab({ userRolesForm, selectedUser, roles, setUnsavedFields }) {
  // When the component mounts, set the form values
  useEffect(() => {
    userRolesForm.setFieldsValue({
      roles: selectedUser.roles.map((role) => role.roleId),
    });
  }, [selectedUser, userRolesForm]);

  // Handle any from value changes - to keep track of unsaved fields
  const onValuesChange = (changedValues, allValues) => {
    // Compare changed value with selected user value
    if (selectedUser) {
      // Existing role ids
      const existingRoleIds = selectedUser.roles.map((role) => role.roleId);
      const existingRolesString = existingRoleIds.sort().join(',');

      Object.keys(changedValues).forEach((_key) => {
        const currentRolesString = allValues.roles.sort().join(',');
        if (existingRolesString !== currentRolesString) {
          setUnsavedFields((prev) => ({ ...prev, roles: ['roles'] }));
        } else {
          // Remove if change is reverted
          setUnsavedFields((prev) => ({ ...prev, roles: [] }));
        }
      });
    }
  };

  return (
    <Card size="small">
      <Form form={userRolesForm} layout="vertical" onValuesChange={onValuesChange}>
        <Form.Item
          label="Assigned Roles"
          name="roles"
          required={true}
          rules={[
            {
              required: true,
              message: 'Please select at least one role',
            },
          ]}>
          <Select mode="tags">
            {roles.map((role) => (
              <Option key={role.id} value={role.id}>
                {role.roleName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default EditUserRolesTab;
