import React from 'react';
import { Button } from 'antd';

import styles from './settings.module.css';

interface SettingsMapValue {
  id: number;
  name: string;
  component: React.ReactNode;
}

interface EditSettingsButtonProps {
  selectedSetting: string;
  settings: Record<string, SettingsMapValue>;
  setOpenEditModel: (v: boolean) => void;
}

const EditSettingsButton: React.FC<EditSettingsButtonProps> = ({ selectedSetting, settings, setOpenEditModel }) => {
  const handleEdit = () => setOpenEditModel(true);

  const name = settings?.[selectedSetting]?.name ?? 'Instance';

  return (
    <Button className={styles.settings_edit_button} type="primary" onClick={handleEdit}>
      {`Edit ${name} Settings`}
    </Button>
  );
};

export default EditSettingsButton;
