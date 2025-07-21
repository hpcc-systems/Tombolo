import React from 'react';
import { Button } from 'antd';

function EditSettingsButton({ selectedSetting, settings, setOpenEditModel }) {
  const handleEdit = () => {
    setOpenEditModel(true);
  };

  return (
    <Button className="settings_edit_button" type="primary" onClick={handleEdit}>
      {`Edit ${settings[selectedSetting].name} Settings`}
    </Button>
  );
}

export default EditSettingsButton;
