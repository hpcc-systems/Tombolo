import React, { useState, useEffect } from 'react';
import { message } from 'antd';

import AddBtn from './AddBtn';
import EmailTable from './emailTable';
import AddEditModal from './AddEditModal';
import VewEmailDetails from './ViewEmailDetails';
import { authHeader } from '../../../common/AuthHeader';

function Emails() {
  const [modalVisibility, setModalVisibility] = useState(false);
  const [showGroupsDetailModal, setShowGroupsDetailModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  //When the component is mounted ...
  useEffect(() => {
    getGroups();
  }, []);

  //function to get all groups
  const getGroups = async () => {
    try {
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };
      const response = await fetch('/api/emailGroup', { ...payload });

      if (!response.ok) {
        throw Error('Failed to fetch cluster metadata');
      }
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      message.error('Failed to fetch Ms Emails group');
    }
  };

  // When add Emails group button is clicked
  const handleAddEmailsGroupBtnClick = () => {
    setModalVisibility(true);
    setSelectedGroup(null);
  };

  // Edit a Emails Group
  const editGroup = (record) => {
    setIsEditing(true);
    setSelectedGroup(record);
    setModalVisibility(true);
  };

  return (
    <>
      <AddBtn handleAddEmailsGroupBtnClick={handleAddEmailsGroupBtnClick} />
      <AddEditModal
        visible={modalVisibility}
        setModalVisibility={setModalVisibility}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        selectedGroup={selectedGroup}
        groups={groups}
        setGroups={setGroups}
      />
      <EmailTable
        groups={groups}
        setGroups={setGroups}
        editGroup={editGroup}
        setSelectedGroup={setSelectedGroup}
        setShowGroupsDetailModal={setShowGroupsDetailModal}
        setIsEditing={setIsEditing}
      />
      <VewEmailDetails
        showGroupsDetailModal={showGroupsDetailModal}
        setShowGroupsDetailModal={setShowGroupsDetailModal}
        selectedGroup={selectedGroup}
      />
    </>
  );
}

export default Emails;
