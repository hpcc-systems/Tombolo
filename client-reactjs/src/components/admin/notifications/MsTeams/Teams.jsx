import React, { useState, useEffect } from 'react';
import { message } from 'antd';

import AddBtn from './AddBtn';
import MsTeamsHookTable from './MsTeamsHookTable';
import AddEditModel from './AddEditModel';
import { authHeader } from '../../../common/AuthHeader';

function Teams() {
  const [modalVisibility, setModalVisibility] = useState(false);
  const [selectedHook, setSelectedHook] = useState(null);
  const [hooks, setHooks] = useState([]);

  //When the component is mounted ...
  useEffect(() => {
    getHooks();
  }, []);

  //function to get all hooks
  const getHooks = async () => {
    try {
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };
      const response = await fetch('/api/teamsHook', { ...payload });

      if (!response.ok) {
        throw Error('Failed to fetch cluster metadata');
      }
      const data = await response.json();
      setHooks(data);
    } catch (err) {
      message.error('Failed to fetch Ms teams hook');
    }
  };

  // When add teams hook button is clicked
  const handleAddTeamsHookBtnClick = () => {
    setModalVisibility(true);
    setSelectedHook(null);
  };

  // Edit a Teams Hook
  const editHook = (record) => {
    setSelectedHook(record);
    setModalVisibility(true);
  };

  return (
    <>
      <AddBtn handleAddTeamsHookBtnClick={handleAddTeamsHookBtnClick} />
      <AddEditModel
        visible={modalVisibility}
        setModalVisibility={setModalVisibility}
        isEditing={selectedHook !== null}
        selectedHook={selectedHook}
        hooks={hooks}
        setHooks={setHooks}
      />
      <MsTeamsHookTable hooks={hooks} setHooks={setHooks} editHook={editHook} />
    </>
  );
}

export default Teams;
