import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, Row, Col, Select, DatePicker } from 'antd';

//Constants
const { Option } = Select;

const UserFilters = ({ setFilters, users, setFiltersVisible, roles }) => {
  // Form instance
  const [form] = Form.useForm();

  // Local states
  const [roleOptions, setRoleOptions] = useState([]);
  const [applicationOptions, setApplicationOptions] = useState([]);
  const [verifiedOptions, setVerifiedOptions] = useState([]);
  const [registrationStatusOptions, setRegistrationStatusOptions] = useState([]);

  // Redux
  const {
    applicationReducer: { applications: allApplications },
  } = useSelector((state) => state);

  //Effects
  useEffect(() => {
    // Display filters if true in local storage
    const filtersVisibility = localStorage.getItem('userFiltersVisible');

    if (filtersVisibility) {
      setFiltersVisible(filtersVisibility === 'true');
    }
  }, []);

  useEffect(() => {
    const filterOptions = { role: [], application: [], verifiedUser: [], registrationStatus: [] };
    users.forEach((user) => {
      const { roles: userRole, applications, verifiedUser, registrationStatus } = user;

      //map through roles and applications and add them
      userRole.forEach((role) => {
        const { roleId } = role;
        const { id, roleName } = roles.find((r) => r.id === roleId);
        if (id) {
          const indexOfRoleInFilter = filterOptions.role.findIndex((r) => r.id === id);
          if (indexOfRoleInFilter === -1) {
            filterOptions.role.push({ id, roleName });
          }
        }
      });

      applications.forEach((application) => {
        const { application_id } = application;
        const { id, title } = allApplications.find((a) => a.id === application_id);

        if (id) {
          const indexOfApplicationInFilter = filterOptions.application.findIndex((a) => a.id === id);
          if (indexOfApplicationInFilter === -1) {
            filterOptions.application.push({ id, title });
          }
        }
      });

      if (verifiedUser === true && !filterOptions.verifiedUser.includes('True')) {
        filterOptions.verifiedUser.push('True');
      }
      if (verifiedUser === false && !filterOptions.verifiedUser.includes('False')) {
        filterOptions.verifiedUser.push('False');
      }

      if (!filterOptions.registrationStatus.includes(registrationStatus)) {
        filterOptions.registrationStatus.push(registrationStatus);
      }
    });

    setRoleOptions(filterOptions.role);
    setApplicationOptions(filterOptions.application);
    setVerifiedOptions(filterOptions.verifiedUser);
    setRegistrationStatusOptions(filterOptions.registrationStatus);
  }, [users]);

  // When the filter item changes
  const handleFormChange = () => {
    const allFilters = form.getFieldsValue();
    setFilters(allFilters);
  };

  //JSX
  return (
    <div className="notifications__filters">
      <Form form={form} onValuesChange={handleFormChange} className="notifications__filters_form">
        <Row gutter={12}>
          <Col span={5}>
            <div className="notifications__filter-label">Role</div>
            <Form.Item name="role">
              <Select placeholder="Role" allowClear>
                {roleOptions.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.roleName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={5}>
            <div className="notifications__filter-label">Application</div>
            <Form.Item name="application">
              <Select placeholder="Application" allowClear>
                {applicationOptions.map((a) => (
                  <Option key={a.id} value={a.id}>
                    {a.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={4}>
            <div className="notifications__filter-label">Verified</div>
            <Form.Item name="verifiedUser">
              <Select placeholder="Verified" allowClear>
                {verifiedOptions.map((v) => (
                  <Option key={v} value={v}>
                    {v}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={4}>
            <div className="notifications__filter-label">Registration Status</div>
            <Form.Item name="registrationStatus">
              <Select placeholder="Registration Status" allowClear>
                {registrationStatusOptions.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={6}>
            <div className="notifications__filter-label">Last Accessed Date</div>
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
