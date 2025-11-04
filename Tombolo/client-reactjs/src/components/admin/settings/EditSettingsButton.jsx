// Imports from libraries
import React from 'react';
import { Button } from 'antd';

// Local imports
import styles from './settings.module.css';

function EditSettingsButton({ selectedSetting, settings, setOpenEditModel }) {
  const handleEdit = () => {
    setOpenEditModel(true);
  };

  return (
    <Button className={styles.settings_edit_button} type="primary" onClick={handleEdit}>
      {`Edit ${settings[selectedSetting].name} Settings`}
    </Button>
  );
}

export default EditSettingsButton;
