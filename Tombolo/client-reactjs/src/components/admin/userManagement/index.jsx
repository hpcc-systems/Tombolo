import React, { useState, useEffect, message } from 'react';

import BreadCrumbs from '../../common/BreadCrumbs';
import UserManagementActionButton from './ActionButton';
import UserManagementTable from './Table';
import UserFilters from './Filters';
import './User.css';
import { getAllUsers, getAllRoles } from './Utils';
import UserDetailModal from './UserDetailModal';
import EditUserModel from './EditUserModel';

const UserManagement = () => {
  //general states
  const [selectedRows, setSelectedRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);

  //filters
  const [filteringUsers, setFilteringUsers] = useState(false);
  const [filters, setFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState(users);

  //modal visibility states
  const [_bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [_displayAddUserModal, setDisplayAddUserModal] = useState(false);
  const [displayUserDetailsModal, setDisplayUserDetailsModal] = useState(false);
  const [displayEditUserModal, setDisplayEditUserModal] = useState(false);

  //When add button new job monitoring button clicked
  const handleAddUserButtonClick = () => {
    setDisplayAddUserModal(true);
  };

  useEffect(() => {
    //when filters change, calculate filtered users
    if (Object.keys(filters).length > 0) {
      setFilteringUsers(true);

      const filtered = users.filter((user) => {
        if (filters.role) {
          const userRoleIds = user.roles.map((role) => role.roleId);
          if (!userRoleIds.includes(filters.role)) {
            return false;
          }
        }
        if (filters.application) {
          if (!user.applications.includes(filters.application)) {
            const userApplicationIds = user.applications.map((application) => application.application_id);

            if (!userApplicationIds.includes(filters.application)) {
              return false;
            }
          }
        }

        if (filters.verifiedUser) {
          if (filters.verifiedUser === 'True') {
            if (!user.verifiedUser) {
              return false;
            }
          }
          if (filters.verifiedUser === 'False') {
            if (user.verifiedUser) {
              return false;
            }
          }
        }

        if (filters.registrationStatus) {
          if (user.registrationStatus !== filters.registrationStatus) {
            return false;
          }
        }
        return true;
      });

      setFilteredUsers(filtered);
      setFilteringUsers(false);
    } else {
      setFilteringUsers(false);
    }
  }, [filters]);

  // When component mounts, get all users
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        message.error('Failed to get users');
      }
    };
    fetchUser();

    // Get all roles when component mounts
    const fetchRoles = async () => {
      try {
        const allRoles = await getAllRoles();
        setRoles(allRoles);
      } catch (error) {
        message.warning('Failed to get roles');
      }
    };
    fetchRoles();
  }, []);

  return (
    <>
      <BreadCrumbs
        extraContent={
          <UserManagementActionButton
            handleAddUserButtonClick={handleAddUserButtonClick}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            setUsers={setUsers}
            setBulkEditModalVisibility={setBulkEditModalVisibility}
            setFilteredUsers={setFilteredUsers}
          />
        }
      />
      <UserFilters users={users} setFilters={setFilters} filters={filters} roles={roles} />
      <UserManagementTable
        users={filteredUsers}
        filteringUsers={filteringUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setSelectedRows={setSelectedRows}
        setDisplayEditUserModal={setDisplayEditUserModal}
        setDisplayAddUserModal={setDisplayAddUserModal}
        setDisplayUserDetailsModal={setDisplayUserDetailsModal}
        setUsers={setUsers}
        setFilteredUsers={setFilteredUsers}
        roles={roles}
      />
      <UserDetailModal
        displayUserDetailsModal={displayUserDetailsModal}
        setDisplayUserDetailsModal={setDisplayUserDetailsModal}
        selectedUser={selectedUser}
        roles={roles}
      />

      {selectedUser && (
        <EditUserModel
          displayEditUserModal={displayEditUserModal}
          setDisplayEditUserModal={setDisplayEditUserModal}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          setUsers={setUsers}
          setFilteredUsers={setFilteredUsers}
          roles={roles}
        />
      )}
    </>
  );
};

export default UserManagement;
