import React, { useState, useEffect } from 'react';
import BreadCrumbs from '../../common/BreadCrumbs';
import UserManagementActionButton from './ActionButton';
import UserManagementTable from './Table';
import UserFilters from './Filters';
import './User.css';

const UserManagement = () => {
  //general states
  const [selectedRows, setSelectedRows] = useState([]);
  const [users, setUsers] = useState([
    {
      id: 0,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@doe.com',
      roles: ['Admin'],
      applications: ['test'],
      verifiedUser: true,
      registrationStatus: 'active',
    },
    {
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@doe.com',
      roles: [''],
      applications: [''],
      verifiedUser: false,
      registrationStatus: 'pending',
    },
    {
      id: 2,
      firstName: 'Jim',
      lastName: 'Doe',
      email: 'jim@doe.com',
      roles: ['Contributor'],
      applications: ['test'],
      verifiedUser: false,
      registrationStatus: 'pending',
    },
  ]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingData, setEditingData] = useState(null);

  //filters
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filteringUsers, setFilteringUsers] = useState(false);
  const [filters, setFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState(users);

  //modal visibility states
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [displayAddUserModal, setDisplayAddUserModal] = useState(false);
  const [displayUserDetailsModal, setDisplayUserDetailsModal] = useState(false);
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);

  //When add button new job monitoring button clicked
  const handleAddUserButtonClick = () => {
    setDisplayAddUserModal(true);
  };

  //unused so far
  console.log(
    editingData,
    bulkEditModalVisibility,
    displayAddUserModal,
    displayUserDetailsModal,
    displayAddRejectModal,
    setFilteringUsers
  );

  useEffect(() => {
    //when filters change, calculate filtered users
    if (Object.keys(filters).length > 0) {
      setFilteringUsers(true);

      const filtered = users.filter((user) => {
        if (filters.role) {
          if (!user.roles.includes(filters.role)) {
            return false;
          }
        }
        if (filters.application) {
          if (!user.applications.includes(filters.application)) {
            return false;
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
            setFiltersVisible={setFiltersVisible}
            filtersVisible={filtersVisible}
          />
        }
      />
      <UserFilters
        users={users}
        setFilters={setFilters}
        filters={filters}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
      />
      <UserManagementTable
        users={filteredUsers}
        filteringUsers={filteringUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setSelectedRows={setSelectedRows}
        setEditingData={setEditingData}
        setDisplayAddUserModal={setDisplayAddUserModal}
        setDisplayUserDetailsModal={setDisplayUserDetailsModal}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
      />
    </>
  );
};

export default UserManagement;
