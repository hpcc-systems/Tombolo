import React, { useState, useEffect } from 'react';

import BreadCrumbs from '../../common/BreadCrumbs';
import { handleError } from '@/components/common/handleResponse';
import UserManagementActionButton from './ActionButton';
import UserManagementTable from './Table';
import UserFilters from './Filters';
import usersService from '@/services/users.service';
import rolesService from '@/services/roles.service';
import UserDetailModal from './UserDetailModal';
import EditUserModel from './EditUserModel';
import AddUserModal from './AddUserModal';

const UserManagement: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  const [filteringUsers, setFilteringUsers] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filteredUsers, setFilteredUsers] = useState<any[]>(users);

  const [_bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [displayAddUserModal, setDisplayAddUserModal] = useState(false);
  const [displayUserDetailsModal, setDisplayUserDetailsModal] = useState(false);
  const [displayEditUserModal, setDisplayEditUserModal] = useState(false);

  const handleAddUserButtonClick = () => setDisplayAddUserModal(true);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      setFilteringUsers(true);
      const filtered = users.filter(user => {
        if (filters.role) {
          const userRoleIds = user.roles.map((role: any) => role.roleId);
          if (!userRoleIds.includes(filters.role)) return false;
        }
        if (filters.application) {
          if (!user.applications.includes(filters.application)) {
            const userApplicationIds = user.applications.map((application: any) => application.application_id);
            if (!userApplicationIds.includes(filters.application)) return false;
          }
        }
        if (filters.verifiedUser) {
          if (filters.verifiedUser === 'True') {
            if (!user.verifiedUser) return false;
          }
          if (filters.verifiedUser === 'False') {
            if (user.verifiedUser) return false;
          }
        }
        if (filters.registrationStatus) {
          if (user.registrationStatus !== filters.registrationStatus) return false;
        }
        return true;
      });

      setFilteredUsers(filtered);
      setFilteringUsers(false);
    } else {
      setFilteringUsers(false);
    }
  }, [filters, users]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await usersService.getAll();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        handleError('Failed to get users');
      }
    };
    fetchUser();

    const fetchRoles = async () => {
      try {
        const allRoles = await rolesService.getAll();
        setRoles(allRoles);
      } catch (error) {
        handleError('Failed to get roles');
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
      <UserFilters users={users} setFilters={setFilters} setFiltersVisible={() => {}} roles={roles} />
      <UserManagementTable
        users={filteredUsers}
        filteringUsers={filteringUsers}
        setSelectedUser={setSelectedUser}
        setDisplayUserDetailsModal={setDisplayUserDetailsModal}
        setSelectedRows={setSelectedRows}
        setDisplayEditUserModal={setDisplayEditUserModal}
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

      <AddUserModal
        roles={roles}
        displayAddUserModal={displayAddUserModal}
        setDisplayAddUserModal={setDisplayAddUserModal}
        setUsers={setUsers}
        filters={filters}
        setFilteredUsers={setFilteredUsers}
      />
    </>
  );
};

export default UserManagement;
