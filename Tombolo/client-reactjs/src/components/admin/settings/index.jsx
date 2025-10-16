// Imports from libraries
import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';

// Local imports
const GeneralSettings = React.lazy(() => import('./GeneralSettings'));
const SupportSettings = React.lazy(() => import('./SupportSettings'));
import { handleError } from '@/components/common/handleResponse';
import instanceSettingsService from '@/services/instanceSettings.service';
import BreadCrumbs from '../../common/BreadCrumbs';
import EditSettingsButton from './EditSettingsButton';
import EditSettingsModel from './EditSettingsModel';
import styles from './settings.module.css';

// Destructuring Layout
const { Sider, Content } = Layout;

function Settings() {
  // States
  const [selectedSetting, setSelectedSetting] = useState('general');
  const [instanceSettings, setInstanceSettings] = useState({});
  const [openEditModel, setOpenEditModel] = useState(false);

  // Settings
  const settings = {
    general: {
      id: 0,
      name: 'General',
      component: <GeneralSettings instanceSettings={instanceSettings} setInstanceSettings={setInstanceSettings} />,
    },
    support: { id: 1, name: 'Support', component: <SupportSettings instanceSettings={instanceSettings} /> },
  };

  // UseEffects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const instanceSettings = await instanceSettingsService.getAll();
        setInstanceSettings(instanceSettings);
      } catch (error) {
        handleError(error.message);
      }
    };

    fetchData();
  }, []);

  // Handle setting change
  const handleSettingChange = (setting) => {
    setSelectedSetting(setting);
  };

  return (
    <div className={styles.settings}>
      <BreadCrumbs
        extraContent={
          <EditSettingsButton
            selectedSetting={selectedSetting}
            settings={settings}
            setOpenEditModel={setOpenEditModel}
          />
        }
      />
      <Layout className={styles.settingsLayout}>
        <Sider theme="light" className={styles.settingsSider}>
          <div>
            {Object.keys(settings).map((setting) => (
              <div
                key={settings[setting].id}
                className={`${styles.settingItem} ${selectedSetting === setting ? styles.selectedSetting : ''}`}
                onClick={() => handleSettingChange(setting)}>
                {settings[setting].name}
              </div>
            ))}
          </div>
        </Sider>
        <Content className={styles.settingsContent}>
          <div style={{ height: '82vh' }} size="small">
            {settings[selectedSetting].component}
          </div>
        </Content>
      </Layout>
      <EditSettingsModel
        selectedSetting={selectedSetting}
        settings={settings}
        openEditModel={openEditModel}
        setOpenEditModel={setOpenEditModel}
        instanceSettings={instanceSettings}
        setInstanceSettings={setInstanceSettings}
      />
    </div>
  );
}

export default Settings;
