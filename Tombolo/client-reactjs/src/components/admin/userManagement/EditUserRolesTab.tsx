import React, { useEffect } from 'react';
import { Card, Form, Select } from 'antd';
import type { FormInstance } from 'antd';

const { Option } = Select;

interface Props {
  userRolesForm: FormInstance;
  selectedUser: any;
  roles: any[];
  setUnsavedFields: (updater: (prev: any) => any) => void;
}

const EditUserRolesTab: React.FC<Props> = ({ userRolesForm, selectedUser, roles, setUnsavedFields }) => {
  useEffect(() => {
    userRolesForm.setFieldsValue({ roles: selectedUser.roles.map((role: any) => role.roleId) });
  }, [selectedUser, userRolesForm]);

  const onValuesChange = (changedValues: any, allValues: any) => {
    if (selectedUser) {
      const existingRoleIds = selectedUser.roles.map((role: any) => role.roleId);
      const existingRolesString = existingRoleIds.sort().join(',');

      Object.keys(changedValues).forEach(_key => {
        const currentRolesString = allValues.roles.sort().join(',');
        if (existingRolesString !== currentRolesString) {
          setUnsavedFields((prev: any) => ({ ...prev, roles: ['roles'] }));
        } else {
          setUnsavedFields((prev: any) => ({ ...prev, roles: [] }));
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
          required
          rules={[{ required: true, message: 'Please select at least one role' }]}>
          <Select mode="tags">
            {roles.map(role => (
              <Option key={role.id} value={role.id}>
                {role.roleName}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditUserRolesTab;
