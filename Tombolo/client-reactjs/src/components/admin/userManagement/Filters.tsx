import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, Select, DatePicker } from 'antd';
import { Constants } from '@/components/common/Constants';

const { Option } = Select;

interface Props {
  setFilters: (f: Record<string, any>) => void;
  users: any[];
  setFiltersVisible: (v: boolean) => void;
  roles: any[];
}

const UserFilters: React.FC<Props> = ({ setFilters, users, setFiltersVisible, roles }) => {
  const [form] = Form.useForm();
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [applicationOptions, setApplicationOptions] = useState<any[]>([]);
  const [verifiedOptions, setVerifiedOptions] = useState<any[]>([]);
  const [registrationStatusOptions, setRegistrationStatusOptions] = useState<any[]>([]);

  const allApplications = useSelector((state: any) => state.application.applications);

  useEffect(() => {
    const filtersVisibility = localStorage.getItem(`${Constants.USERS_FILTER_VS_KEY}`);
    if (filtersVisibility) setFiltersVisible(filtersVisibility === 'true');
  }, []);

  useEffect(() => {
    const filterOptions: any = { role: [], application: [], verifiedUser: [], registrationStatus: [] };
    users.forEach(user => {
      const { roles: userRole, applications, verifiedUser, registrationStatus } = user;

      userRole.forEach(role => {
        const { roleId } = role;
        const currentRole = roles.find(r => r.id === roleId);
        if (currentRole) {
          const { id, roleName } = currentRole;
          const indexOfRoleInFilter = filterOptions.role.findIndex((r: any) => r.id === id);
          if (indexOfRoleInFilter === -1) filterOptions.role.push({ id, roleName });
        }
      });

      if (allApplications) {
        applications.forEach(application => {
          const { application_id } = application;
          const currentApp = allApplications.find((a: any) => a.id === application_id);
          if (currentApp?.id) {
            const indexOfApplicationInFilter = filterOptions.application.findIndex((a: any) => a.id === currentApp.id);
            if (indexOfApplicationInFilter === -1)
              filterOptions.application.push({ id: currentApp.id, title: currentApp.title });
          }
        });
      }

      if (verifiedUser === true && !filterOptions.verifiedUser.includes('True'))
        filterOptions.verifiedUser.push('True');
      if (verifiedUser === false && !filterOptions.verifiedUser.includes('False'))
        filterOptions.verifiedUser.push('False');

      if (!filterOptions.registrationStatus.includes(registrationStatus))
        filterOptions.registrationStatus.push(registrationStatus);
    });

    setRoleOptions(filterOptions.role);
    setApplicationOptions(filterOptions.application);
    setVerifiedOptions(filterOptions.verifiedUser);
    setRegistrationStatusOptions(filterOptions.registrationStatus);
  }, [users, allApplications, roles]);

  const handleFormChange = () => {
    const allFilters = form.getFieldsValue();
    setFilters(allFilters);
  };

  return (
    <div className="notifications__filters">
      <Form form={form} onValuesChange={handleFormChange} className="notifications__filters_form">
        <Row gutter={12}>
          <Col span={5}>
            <div className="notifications__filter_label">Role</div>
            <Form.Item name="role">
              <Select placeholder="Role" allowClear>
                {roleOptions.map(s => (
                  <Option key={s.id} value={s.id}>
                    {s.roleName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={5}>
            <div className="notifications__filter_label">Application</div>
            <Form.Item name="application">
              <Select placeholder="Application" allowClear>
                {applicationOptions.map(a => (
                  <Option key={a.id} value={a.id}>
                    {a.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={4}>
            <div className="notifications__filter_label">Verified</div>
            <Form.Item name="verifiedUser">
              <Select placeholder="Verified" allowClear>
                {verifiedOptions.map(v => (
                  <Option key={v} value={v}>
                    {v}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={4}>
            <div className="notifications__filter_label">Account Status</div>
            <Form.Item name="registrationStatus">
              <Select placeholder="Account Status" allowClear>
                {registrationStatusOptions.map(r => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={6}>
            <div className="notifications__filter_label">Last Accessed Date</div>
            <Form.Item name="lastAccessed">
              <DatePicker.RangePicker style={{ width: '100%' }} allowClear disabled />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default UserFilters;
