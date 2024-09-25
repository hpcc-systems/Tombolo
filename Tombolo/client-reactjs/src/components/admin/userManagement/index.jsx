import React, { useState, useEffect } from 'react';
import BreadCrumbs from '../../common/BreadCrumbs';
import UserManagementActionButton from './ActionButton';
import UserManagementTable from './Table';
import UserFilters from './Filters';
import './User.css';

const UserManagement = () => {
  //general states
  const [selectedRows, setSelectedRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingData, setEditingData] = useState(null);

  //filters
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filteringUsers, setFilteringUsers] = useState(false);
  const [filters, setFilters] = useState({});

  //modal visibility states
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [displayAddUserModal, setDisplayAddUserModal] = useState(false);
  const [displayUserDetailsModal, setDisplayUserDetailsModal] = useState(false);
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);

  //When add button new job monitoring button clicked
  const handleAddUserButtonClick = () => {
    setDisplayAddUserModal(true);
  };

  useEffect(() => {
    //unused
    console.log(
      editingData,
      bulkEditModalVisibility,
      displayAddUserModal,
      displayUserDetailsModal,
      displayAddRejectModal,
      setFilteringUsers
    );
  });

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
        users={users}
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
